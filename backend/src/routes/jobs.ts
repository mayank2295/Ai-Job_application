import { Router, Request, Response } from 'express';
import { all, get, query, run } from '../database/db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/jobs — All active jobs (public for candidates)
// Supports: type, department, location, search, experience, salary_min, salary_max
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, department, search, location, salary_min, salary_max, experience } = req.query;
    let q = 'SELECT * FROM jobs WHERE is_active = TRUE';
    const params: any[] = [];

    if (type && type !== 'all') {
      params.push(type);
      q += ` AND type = $${params.length}`;
    }
    if (department && department !== 'all') {
      params.push(department);
      q += ` AND department = $${params.length}`;
    }
    if (location && location !== 'all') {
      params.push(`%${location}%`);
      q += ` AND location ILIKE $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      q += ` AND (title ILIKE $${idx} OR description ILIKE $${idx} OR department ILIKE $${idx} OR location ILIKE $${idx})`;
    }
    if (experience && experience !== 'all') {
      params.push(`%${experience}%`);
      q += ` AND (requirements ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    q += ' ORDER BY created_at DESC';
    const { rows: jobs } = await query(q, params);

    // Salary filter — salary_range is text like "Rs.15L - Rs.22L", filter by first number
    let filtered = jobs;
    if (salary_min || salary_max) {
      const min = salary_min ? Number(salary_min) : 0;
      const max = salary_max ? Number(salary_max) : Infinity;
      filtered = jobs.filter((j: any) => {
        if (!j.salary_range) return true;
        const match = j.salary_range.match(/[\d.]+/);
        if (!match) return true;
        const val = parseFloat(match[0]);
        return val >= min && val <= max;
      });
    }

    res.json({ jobs: filtered, total: filtered.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/jobs/all — Admin: all jobs including inactive
router.get('/all', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows: jobs } = await query(`
      SELECT j.*, COUNT(a.id)::int AS applicant_count
      FROM jobs j
      LEFT JOIN applications a ON a.job_id = j.id
      GROUP BY j.id
      ORDER BY j.created_at DESC
    `);
    res.json({ jobs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/jobs/:id — Get single job
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await get('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    res.json({ job });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/jobs — Admin creates a job
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, company, location, type, description, requirements, salary_range, department } = req.body;
    if (!title || !location || !description) {
      res.status(400).json({ error: 'title, location, and description are required' });
      return;
    }
    const id = uuidv4();
    const now = new Date().toISOString();
    const reqJson = Array.isArray(requirements) ? JSON.stringify(requirements) : (requirements || '[]');

    const result = await query(`
      INSERT INTO jobs (id, title, company, location, type, description, requirements, salary_range, department, is_active, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `, [id, title, company || 'JobFlow Inc.', location, type || 'Full-Time', description, reqJson, salary_range || '', department || '', true, now, now]);

    res.status(201).json({ job: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/jobs/:id — Admin updates a job
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await get('SELECT id FROM jobs WHERE id = $1', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const { title, company, location, type, description, requirements, salary_range, department, is_active } = req.body;
    const reqJson = requirements !== undefined
      ? (Array.isArray(requirements) ? JSON.stringify(requirements) : requirements)
      : undefined;

    await run(`
      UPDATE jobs SET
        title = COALESCE($1, title),
        company = COALESCE($2, company),
        location = COALESCE($3, location),
        type = COALESCE($4, type),
        description = COALESCE($5, description),
        requirements = COALESCE($6, requirements),
        salary_range = COALESCE($7, salary_range),
        department = COALESCE($8, department),
        is_active = COALESCE($9, is_active),
        updated_at = $10
      WHERE id = $11
    `, [title, company, location, type, description, reqJson, salary_range, department,
        is_active !== undefined ? is_active : null,
        new Date().toISOString(), req.params.id]);

    const updated = await get('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
    res.json({ job: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/jobs/:id — Admin deletes a job
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await run('DELETE FROM jobs WHERE id = $1', [req.params.id]);
    res.json({ message: 'Job deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/jobs/:id/applications — Admin: view applicants for a job
router.get('/:id/applications', async (req: Request, res: Response): Promise<void> => {
  try {
    const apps = await all(`
      SELECT a.*, u.photo_url, u.skills as candidate_skills
      FROM applications a
      LEFT JOIN users u ON u.firebase_uid = a.user_id
      WHERE a.job_id = $1
      ORDER BY a.ai_score DESC NULLS LAST, a.created_at DESC
    `, [req.params.id]);
    res.json({ applications: apps, total: apps.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
