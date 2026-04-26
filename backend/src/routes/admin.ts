import { Router, Request, Response } from 'express';
import { all, get, run } from '../database/db';

const router = Router();

// GET /api/admin/applications/kanban
router.get('/applications/kanban', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await all<any>(
      `SELECT id, status, full_name, position, created_at
       FROM applications
       ORDER BY created_at DESC`
    );
    const grouped: Record<string, any[]> = {
      pending: [],
      reviewing: [],
      shortlisted: [],
      interviewed: [],
      accepted: [],
      rejected: [],
    };

    rows.forEach((row) => {
      const avatarInitials = String(row.full_name || 'U')
        .split(' ')
        .map((part: string) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      const card = {
        id: row.id,
        candidateName: row.full_name,
        jobTitle: row.position,
        appliedAt: row.created_at,
        avatarInitials,
      };
      if (grouped[row.status]) grouped[row.status].push(card);
    });

    res.json(grouped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/notifications?user_id=xxx
router.get('/notifications', async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id } = req.query;
    if (!user_id) { res.status(400).json({ error: 'user_id required' }); return; }
    const rows = await all<any>(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
      [user_id as string]
    );
    res.json({ notifications: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/notifications/read
router.patch('/notifications/read', async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id } = req.body;
    if (!user_id) { res.status(400).json({ error: 'user_id required' }); return; }
    await run(`UPDATE notifications SET is_read = TRUE WHERE user_id = $1`, [user_id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/top-candidates — top 5 by AI score
router.get('/top-candidates', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await all<any>(
      `SELECT id, full_name, email, position, ai_score, status, created_at
       FROM applications
       WHERE ai_score IS NOT NULL
       ORDER BY ai_score DESC
       LIMIT 5`
    );
    res.json({ candidates: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/subscriptions — all users with subscription details
router.get('/subscriptions', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await all<any>(
      `SELECT
         id, name, email, photo_url,
         subscription_tier,
         subscription_started_at,
         subscription_expires_at,
         razorpay_payment_id,
         created_at
       FROM users
       ORDER BY
         CASE WHEN subscription_tier != 'free' THEN 0 ELSE 1 END,
         subscription_started_at DESC NULLS LAST`
    );
    res.json({ subscriptions: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/subscriptions/stats — summary counts
router.get('/subscriptions/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await get<any>(
      `SELECT
         COUNT(*) FILTER (WHERE subscription_tier != 'free') AS paid_users,
         COUNT(*) FILTER (WHERE subscription_tier = 'free') AS free_users,
         COUNT(*) FILTER (WHERE subscription_expires_at < NOW() AND subscription_tier != 'free') AS expired,
         COUNT(*) FILTER (WHERE subscription_expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days') AS expiring_soon
       FROM users`
    );
    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
