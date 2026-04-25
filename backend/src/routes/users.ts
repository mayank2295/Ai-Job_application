import { Router, Request, Response } from 'express';
import { get, run, query } from '../database/db';
import { v4 as uuidv4 } from 'uuid';
import { sendWelcomeEmail } from '../services/emailService';

const router = Router();
const ADMIN_EMAIL = 'mayankgupta23081@gmail.com';

// POST /api/users/sync — Called by frontend after Firebase login to sync user into PostgreSQL
router.post('/sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const { firebase_uid, email, name, photo_url } = req.body;
    if (!firebase_uid || !email) {
      res.status(400).json({ error: 'firebase_uid and email are required' });
      return;
    }

    const role = email === ADMIN_EMAIL ? 'admin' : 'candidate';
    const id = uuidv4();
    const now = new Date().toISOString();

    // Upsert user
    const existing = await get('SELECT id FROM users WHERE firebase_uid = $1', [firebase_uid]);
    await run(`
      INSERT INTO users (id, firebase_uid, email, name, photo_url, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (firebase_uid) DO UPDATE
        SET name = EXCLUDED.name,
            photo_url = EXCLUDED.photo_url,
            updated_at = EXCLUDED.updated_at
    `, [id, firebase_uid, email, name || '', photo_url || '', role, now, now]);
    if (!existing) {
      sendWelcomeEmail(email, name || '').catch((err) => console.error('Welcome email failed:', err));
    }

    const user = await get('SELECT * FROM users WHERE firebase_uid = $1', [firebase_uid]);
    res.json({ user });
  } catch (error: any) {
    console.error('Sync user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/me?firebase_uid=xxx — Get current user's profile + role
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const { firebase_uid, email, name, photo_url } = req.query;
    if (!firebase_uid) {
      res.status(400).json({ error: 'firebase_uid is required' });
      return;
    }
    const user = await get('SELECT * FROM users WHERE firebase_uid = $1', [firebase_uid as string]);
    if (!user) {
      if (!email) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      const role = String(email) === ADMIN_EMAIL ? 'admin' : 'candidate';
      const id = uuidv4();
      const now = new Date().toISOString();
      await run(
        `INSERT INTO users (id, firebase_uid, email, name, photo_url, role, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, firebase_uid as string, email as string, String(name || ''), String(photo_url || ''), role, now, now]
      );
      sendWelcomeEmail(email as string, String(name || '')).catch((err) => console.error('Welcome email failed:', err));
      const created = await get('SELECT * FROM users WHERE firebase_uid = $1', [firebase_uid as string]);
      res.json({ user: created });
      return;
    }
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/users/me — Update candidate profile
router.patch('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const { firebase_uid, name, phone, skills, headline, resume_url } = req.body;
    if (!firebase_uid) {
      res.status(400).json({ error: 'firebase_uid is required' });
      return;
    }

    await run(`
      UPDATE users SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        skills = COALESCE($3, skills),
        headline = COALESCE($4, headline),
        resume_url = COALESCE($5, resume_url),
        updated_at = $6
      WHERE firebase_uid = $7
    `, [name, phone, skills, headline, resume_url, new Date().toISOString(), firebase_uid]);

    const updated = await get('SELECT * FROM users WHERE firebase_uid = $1', [firebase_uid]);
    res.json({ user: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users — Admin only: list all users
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { rows: users } = await query('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ users, total: users.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
