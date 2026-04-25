import { Router, Request, Response } from 'express';
import { all, get, query, run } from '../database/db';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PowerAutomateService } from '../services/powerAutomate';
import { callLLM } from './careerbot';
import { body, validationResult } from 'express-validator';
import { sendStatusUpdateEmail } from '../services/emailService';

const router = Router();

// multer for resume upload (memory storage, max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.txt'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
    }
  },
});

// GET /api/applications - List all applications
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, search, email, sort = 'created_at', order = 'desc', limit = '50', offset = '0' } = req.query;
    const statusValue = Array.isArray(status) ? status[0] : status;
    const searchValue = Array.isArray(search) ? search[0] : search;

    let baseQuery = 'FROM applications WHERE 1=1';
    const params: any[] = [];

    if (statusValue && statusValue !== 'all') {
      params.push(statusValue);
      baseQuery += ` AND status = $${params.length}`;
    }

    if (searchValue) {
      const searchTerm = `%${searchValue}%`;
      const startIndex = params.length + 1;
      params.push(searchTerm, searchTerm, searchTerm);
      baseQuery += ` AND (full_name ILIKE $${startIndex} OR email ILIKE $${startIndex + 1} OR position ILIKE $${startIndex + 2})`;
    }
    if (email) {
      params.push(email);
      baseQuery += ` AND email = $${params.length}`;
    }

    // Count total
    const countRow = await get<{ total: string }>(`SELECT COUNT(*) as total ${baseQuery}`, params);
    const total = Number(countRow?.total ?? 0);

    // Sort and paginate
    const allowedSorts = ['created_at', 'full_name', 'position', 'status', 'ai_score'];
    const sortCol = allowedSorts.includes(sort as string) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    const limitInput = Array.isArray(limit) ? limit[0] : limit;
    const offsetInput = Array.isArray(offset) ? offset[0] : offset;
    const limitValue = Number(limitInput) > 0 ? Number(limitInput) : 50;
    const offsetValue = Number(offsetInput) >= 0 ? Number(offsetInput) : 0;
    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;

    const dataQuery = `SELECT * ${baseQuery} ORDER BY ${sortCol} ${sortOrder} LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
    const { rows: applications } = await query(dataQuery, [...params, limitValue, offsetValue]);

    res.json({
      applications,
      total,
      limit: limitValue,
      offset: offsetValue
    });
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET /api/applications/stats - Get application statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing,
        SUM(CASE WHEN status = 'interviewed' THEN 1 ELSE 0 END) as interviewed,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        AVG(ai_score) as avg_ai_score
      FROM applications
    `);

    const recentActivity = await all(`
      SELECT * FROM applications ORDER BY created_at DESC LIMIT 5
    `);

    const workflowStats = await PowerAutomateService.getWorkflowStats();

    res.json({ stats, recentActivity, workflowStats });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/applications/:id - Get single application
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const application = await get<any>('SELECT * FROM applications WHERE id = $1', [req.params.id]);

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    // Get workflow logs for this application
    const workflowLogs = await all(
      'SELECT * FROM workflow_logs WHERE application_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );

    // Get follow-ups
    const followUps = await all(
      'SELECT * FROM follow_ups WHERE application_id = $1 ORDER BY scheduled_date ASC',
      [req.params.id]
    );

    const candidate = await get<any>(
      'SELECT verified_skills FROM users WHERE (id = $1 OR firebase_uid = $2 OR email = $3) LIMIT 1',
      [application.user_id, application.user_id, application.email]
    );

    res.json({ application, workflowLogs, followUps, candidate });
  } catch (error: any) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// POST /api/applications — Create new application (supports multipart with resume)
router.post('/', upload.single('resume'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, phone, position, experience_years, cover_letter,
            job_id, user_id, resume_text, job_description } = req.body;

    if (!full_name || !email || !position) {
      res.status(400).json({ error: 'Full name, email, and position are required' });
      return;
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    // Handle resume file
    let resumeFilename: string | null = null;
    let resumePath: string | null = null;
    if (req.file) {
      resumeFilename = req.file.originalname;
      const safeFilename = `${id}-${req.file.originalname}`;
      resumePath = `/uploads/${safeFilename}`;
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, safeFilename), req.file.buffer);
    }

    // AI Analysis (async, don't block)
    let aiScore: number | null = null;
    let aiSkills = '';
    let aiMissingSkills = '';
    let aiAnalysis = '';
    if (resume_text && job_description) {
      try {
        const prompt = `You are an expert ATS resume analyst.\nJob Description:\n${String(job_description).slice(0, 800)}\n\nResume:\n${String(resume_text).slice(0, 3500)}\n\nReturn ONLY raw JSON: {"overall_score":<0-100>,"top_skills":[],"missing_keywords":[],"summary":"<2 sentences>"}`;
        const data: any = await callLLM([
          { role: 'system', content: 'You are an ATS expert. Respond ONLY with valid JSON.' },
          { role: 'user', content: prompt },
        ]);
        const raw = data.choices[0].message.content.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(raw);
        aiScore = parsed.overall_score || null;
        aiSkills = JSON.stringify(parsed.top_skills || []);
        aiMissingSkills = JSON.stringify(parsed.missing_keywords || []);
        aiAnalysis = parsed.summary || '';
      } catch(e) { console.error('AI analysis error:', e); }
    }

    const insertResult = await query(`
      INSERT INTO applications
        (id, job_id, user_id, full_name, email, phone, position, experience_years,
         cover_letter, resume_filename, resume_path, ai_score, ai_skills, ai_missing_skills,
         ai_analysis, workflow_status, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *
    `, [
      id, job_id || null, user_id || null,
      full_name, email, phone || null, position,
      experience_years || 0, cover_letter || null,
      resumeFilename, resumePath,
      aiScore, aiSkills, aiMissingSkills, aiAnalysis,
      'triggered', now, now
    ]);

    const application = insertResult.rows[0];

    // Trigger notification webhook
    const autoTrigger = await get<{ value: string }>("SELECT value FROM settings WHERE key = 'auto_trigger_workflows'");
    if (autoTrigger?.value !== 'false') {
      PowerAutomateService.triggerNewApplicationFlow({ id, full_name, email, position, phone, created_at: now })
        .catch(err => console.error('Background flow trigger error:', err));
    }

    res.status(201).json({ application, message: 'Application submitted successfully!' });
  } catch (error: any) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: error?.message || 'Failed to create application', stack: error?.stack });
  }
});

// PATCH /api/applications/:id/status - Update application status
router.patch(
  '/:id/status',
  body('status').isIn(['pending', 'reviewing', 'shortlisted', 'interviewed', 'accepted', 'rejected']),
  async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Invalid status value', details: errors.array() });
      return;
    }
    const { status, notes } = req.body;

    const existing = await get('SELECT * FROM applications WHERE id = $1', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const params: any[] = [status, new Date().toISOString()];
    let updateClause = 'status = $1, updated_at = $2';

    if (notes !== undefined) {
      params.push(notes);
      updateClause += `, notes = $${params.length}`;
    }

    params.push(req.params.id);
    await run(`UPDATE applications SET ${updateClause} WHERE id = $${params.length}`, params);

    const updated = await get('SELECT * FROM applications WHERE id = $1', [req.params.id]);
    sendStatusUpdateEmail(existing.email, existing.full_name, existing.position, status).catch((err) =>
      console.error('Status email failed:', err)
    );

    // Create in-app notification for the candidate
    if (existing.user_id) {
      const statusLabels: Record<string, string> = {
        reviewing: 'is under review',
        shortlisted: 'has been shortlisted',
        interviewed: 'has moved to interview stage',
        accepted: 'has been accepted',
        rejected: 'was not selected this time',
      };
      const label = statusLabels[status] || `status updated to ${status}`;
      run(
        `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)`,
        [existing.user_id, 'Application Update', `Your application for ${existing.position} ${label}.`,
          status === 'accepted' ? 'success' : status === 'rejected' ? 'error' : 'info']
      ).catch(() => {});
    }

    res.json({ application: updated, message: 'Status updated successfully' });
  } catch (error: any) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// DELETE /api/applications/:id - Delete application
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await get('SELECT * FROM applications WHERE id = $1', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    await run('DELETE FROM applications WHERE id = $1', [req.params.id]);
    res.json({ message: 'Application deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

export default router;
