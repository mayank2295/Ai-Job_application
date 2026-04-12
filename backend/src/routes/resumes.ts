import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../database/db';
import { PowerAutomateService } from '../services/powerAutomate';

const router = Router();

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads', 'resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
    }
  }
});

// POST /api/resumes/upload/:applicationId - Upload resume for an application
router.post('/upload/:applicationId', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Check application exists
    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId) as any;
    if (!application) {
      // Clean up uploaded file
      fs.unlinkSync(file.path);
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    // Update application with resume info
    db.prepare(`
      UPDATE applications SET resume_filename = ?, resume_path = ?, updated_at = ?
      WHERE id = ?
    `).run(file.originalname!, file.path, new Date().toISOString(), applicationId);

    // Trigger resume analysis flow
    PowerAutomateService.triggerResumeAnalysisFlow({
      applicationId: applicationId as string,
      resumeFilename: file.originalname!,
      resumePath: file.path,
      applicantName: application.full_name,
      position: application.position
    }).catch(err => console.error('Resume analysis trigger error:', err));

    res.json({
      message: 'Resume uploaded successfully',
      filename: file.originalname,
      size: file.size
    });
  } catch (error: any) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ error: 'Failed to upload resume' });
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

export default router;
