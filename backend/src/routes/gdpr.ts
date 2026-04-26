import { Router, Request, Response } from 'express';
import { all, get, run, transaction } from '../database/db';

const router = Router();

// GET /api/gdpr/export — download all personal data (GDPR Art. 20)
router.get('/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = (req as any).user?.uid;
    if (!uid) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const [user, applications, chatSessions, interviews, notifications] = await Promise.all([
      get('SELECT id, email, name, phone, headline, skills, verified_skills, created_at FROM users WHERE firebase_uid = $1', [uid]),
      all(`SELECT a.id, a.position, a.status, a.cover_letter, a.ai_score, a.created_at, j.title, j.company
           FROM applications a LEFT JOIN jobs j ON a.job_id = j.id WHERE a.user_id = $1`, [uid]),
      all('SELECT id, bot_type, title, created_at FROM chat_sessions WHERE user_id = $1', [uid]),
      all('SELECT id, score, feedback, created_at FROM interview_sessions WHERE candidate_id = (SELECT id FROM users WHERE firebase_uid = $1)', [uid]),
      all('SELECT title, message, type, created_at FROM notifications WHERE user_id = $1', [uid]),
    ]);

    const exportData = {
      export_date: new Date().toISOString(),
      user_profile: user || null,
      applications,
      chat_sessions: chatSessions,
      interview_history: interviews,
      notifications,
    };

    // Audit log the export
    await run(
      'INSERT INTO audit_logs (user_id, entity_type, entity_id, action) VALUES ($1, $2, $3, $4)',
      [uid, 'user', (user as any)?.id || '', 'export']
    ).catch(() => {});

    res.setHeader('Content-Disposition', `attachment; filename="jobflow-data-export-${Date.now()}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(exportData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gdpr/delete-request — request account deletion (GDPR Art. 17)
router.post('/delete-request', async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = (req as any).user?.uid;
    if (!uid) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const user = await get<any>('SELECT id, email FROM users WHERE firebase_uid = $1', [uid]);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const existing = await get<any>(
      `SELECT id FROM deletion_requests WHERE firebase_uid = $1 AND status IN ('pending', 'processing')`,
      [uid]
    );
    if (existing) {
      res.status(400).json({ error: 'A deletion request is already in progress.' });
      return;
    }

    await run(
      'INSERT INTO deletion_requests (user_id, firebase_uid, email) VALUES ($1, $2, $3)',
      [user.id, uid, user.email]
    );

    res.json({
      message: 'Deletion request received. Your account and all data will be permanently deleted within 30 days.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/gdpr/execute/:userId — internal service executes deletion
router.delete('/execute/:userId', async (req: Request, res: Response): Promise<void> => {
  const internalKey = req.headers['x-internal-key'];
  if (internalKey !== process.env.INTERNAL_SERVICE_KEY) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const { userId } = req.params;

  try {
    await transaction(async (client) => {
      // Anonymize applications (keep for recruiter records)
      await client.query(
        `UPDATE applications SET full_name = 'Deleted User', email = 'deleted@deleted.com',
         phone = NULL, cover_letter = '[DELETED]', resume_path = NULL, resume_filename = NULL
         WHERE user_id = $1`,
        [userId]
      );
      await client.query('DELETE FROM chat_sessions WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
      await client.query(
        'DELETE FROM interview_sessions WHERE candidate_id = (SELECT id FROM users WHERE firebase_uid = $1)',
        [userId]
      );
      await client.query(
        `UPDATE users SET email = 'deleted-' || id || '@deleted.com', name = 'Deleted User',
         phone = NULL, photo_url = NULL, headline = NULL, skills = NULL,
         verified_skills = '[]'::jsonb, firebase_uid = 'deleted-' || id
         WHERE firebase_uid = $1`,
        [userId]
      );
      await client.query(
        `UPDATE deletion_requests SET status = 'completed', completed_at = NOW() WHERE firebase_uid = $1`,
        [userId]
      );
    });

    res.json({ message: 'User data deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
