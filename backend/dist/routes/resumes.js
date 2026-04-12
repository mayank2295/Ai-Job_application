"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const db_1 = __importDefault(require("../database/db"));
const powerAutomate_1 = require("../services/powerAutomate");
const router = (0, express_1.Router)();
// Configure multer for file uploads
const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'resumes');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
        }
    }
});
// POST /api/resumes/upload/:applicationId - Upload resume for an application
router.post('/upload/:applicationId', upload.single('resume'), async (req, res) => {
    try {
        const { applicationId } = req.params;
        const file = req.file;
        if (!file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        // Check application exists
        const application = db_1.default.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId);
        if (!application) {
            // Clean up uploaded file
            fs_1.default.unlinkSync(file.path);
            res.status(404).json({ error: 'Application not found' });
            return;
        }
        // Update application with resume info
        db_1.default.prepare(`
      UPDATE applications SET resume_filename = ?, resume_path = ?, updated_at = ?
      WHERE id = ?
    `).run(file.originalname, file.path, new Date().toISOString(), applicationId);
        // Trigger resume analysis flow
        powerAutomate_1.PowerAutomateService.triggerResumeAnalysisFlow({
            applicationId: applicationId,
            resumeFilename: file.originalname,
            resumePath: file.path,
            applicantName: application.full_name,
            position: application.position
        }).catch(err => console.error('Resume analysis trigger error:', err));
        res.json({
            message: 'Resume uploaded successfully',
            filename: file.originalname,
            size: file.size
        });
    }
    catch (error) {
        console.error('Error uploading resume:', error);
        res.status(500).json({ error: 'Failed to upload resume' });
    }
});
// GET /api/resumes/:applicationId/download - Download resume
router.get('/:applicationId/download', (req, res) => {
    try {
        const application = db_1.default.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.applicationId);
        if (!application || !application.resume_path) {
            res.status(404).json({ error: 'Resume not found' });
            return;
        }
        if (!fs_1.default.existsSync(application.resume_path)) {
            res.status(404).json({ error: 'Resume file not found on disk' });
            return;
        }
        res.download(application.resume_path, application.resume_filename);
    }
    catch (error) {
        console.error('Error downloading resume:', error);
        res.status(500).json({ error: 'Failed to download resume' });
    }
});
exports.default = router;
//# sourceMappingURL=resumes.js.map