import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../database/db';
import { PowerAutomateService } from '../services/powerAutomate';
import { AzureBlobStorageService } from '../services/azureBlobStorage';

const router = Router();

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
      return;
    }

    const mimeType = (file.mimetype || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      cb(new Error('Invalid file type for resume upload'));
      return;
    }

    cb(null, true);
  }
});

// POST /api/resumes/upload/:applicationId - Upload resume for an application
router.post('/upload/:applicationId', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    const applicationId = String(req.params.applicationId);
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Check application exists
    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId) as any;
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const uploadResult = await AzureBlobStorageService.uploadResume({
      applicationId,
      fileBuffer: file.buffer,
      originalName: file.originalname,
      contentType: file.mimetype,
    });

    try {
      // Store stable blob URL in DB; signed URL is generated on demand.
      db.prepare(`
        UPDATE applications SET resume_filename = ?, resume_path = ?, updated_at = ?
        WHERE id = ?
      `).run(file.originalname, uploadResult.blobUrl, new Date().toISOString(), applicationId);
    } catch (dbError) {
      await AzureBlobStorageService.deleteBlob(uploadResult.blobName).catch((cleanupError) => {
        console.error('Failed to cleanup blob after DB error:', cleanupError);
      });
      throw dbError;
    }

    // Trigger resume analysis flow
    PowerAutomateService.triggerResumeAnalysisFlow({
      applicationId: applicationId as string,
      resumeFilename: file.originalname,
      resumePath: uploadResult.accessUrl,
      applicantName: application.full_name,
      position: application.position
    }).catch(err => console.error('Resume analysis trigger error:', err));

    res.json({
      message: 'Resume uploaded successfully',
      filename: file.originalname,
      size: file.size,
      fileUrl: uploadResult.blobUrl,
    });
  } catch (error: any) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ error: error?.message || 'Failed to upload resume' });
  }
});

// GET /api/resumes/:applicationId/download - Download resume
router.get('/:applicationId/download', (req: Request, res: Response) => {
  try {
    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.applicationId) as any;

    if (!application || !application.resume_path) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }

    if (application.resume_path.startsWith('http://') || application.resume_path.startsWith('https://')) {
      AzureBlobStorageService.getReadUrlFromStoredUrl(application.resume_path)
        .then((signedUrl) => res.redirect(signedUrl))
        .catch((error) => {
          console.error('Error generating signed resume URL:', error);
          res.status(500).json({ error: 'Failed to generate resume download link' });
        });
      return;
    }

    if (!fs.existsSync(application.resume_path)) {
      res.status(404).json({ error: 'Resume file not found on disk' });
      return;
    }

    res.download(application.resume_path, application.resume_filename);
  } catch (error: any) {
    console.error('Error downloading resume:', error);
    res.status(500).json({ error: 'Failed to download resume' });
  }
});

router.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File too large. Maximum allowed size is 10MB' });
      return;
    }
    res.status(400).json({ error: error.message });
    return;
  }

  if (error) {
    res.status(400).json({ error: error.message || 'Invalid upload request' });
    return;
  }

  res.status(500).json({ error: 'Upload processing failed' });
});

export default router;
