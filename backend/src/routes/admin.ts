import { Router, Request, Response } from 'express';
import { all, run } from '../database/db';

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

export default router;
