import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { get, run } from '../database/db';
import { uploadResume } from '../services/cloudinaryStorage';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.doc', '.docx', '.txt'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
    }
  },
});

// POST /api/resumes/upload/:applicationId
router.post('/upload/:applicationId', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    const applicationId = String(req.params.applicationId);
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const application = await get('SELECT * FROM applications WHERE id = $1', [applicationId]) as any;
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    // Upload to Cloudinary
    const { url, publicId } = await uploadResume(file.buffer, file.originalname, applicationId);

    await run(
      `UPDATE applications SET resume_filename = $1, resume_path = $2, updated_at = $3 WHERE id = $4`,
      [file.originalname, url, new Date().toISOString(), applicationId]
    );

    res.json({
      message: 'Resume uploaded successfully',
      filename: file.originalname,
      size: file.size,
      fileUrl: url,
      publicId,
    });
  } catch (error: any) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: error?.message || 'Failed to upload resume' });
  }
});

// GET /api/resumes/:applicationId/download
// Since Cloudinary URLs are direct HTTPS links, just redirect to the stored URL
router.get('/:applicationId/download', async (req: Request, res: Response) => {
  try {
    const application = await get('SELECT * FROM applications WHERE id = $1', [req.params.applicationId]) as any;

    if (!application || !application.resume_path) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }

    // Cloudinary URL — redirect directly
    if (application.resume_path.startsWith('http')) {
      res.redirect(application.resume_path);
      return;
    }

    res.status(404).json({ error: 'Resume file not available' });
  } catch (error: any) {
    console.error('Resume download error:', error);
    res.status(500).json({ error: 'Failed to download resume' });
  }
});

// Multer error handler
router.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  if (error?.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'File too large. Maximum 10MB allowed.' });
    return;
  }
  res.status(400).json({ error: error?.message || 'Upload failed' });
});

export default router;
