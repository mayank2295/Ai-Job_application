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

// GET /api/admin/candidate-analytics — all candidates with their scores
router.get('/candidate-analytics', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Candidates with their profile + verified skills + ATS scores
    const users = await all<any>(
      `SELECT
         u.id, u.name, u.email, u.photo_url, u.skills, u.headline,
         u.verified_skills, u.reputation_score, u.created_at,
         COUNT(DISTINCT a.id) AS application_count,
         ROUND(AVG(a.ai_score) FILTER (WHERE a.ai_score IS NOT NULL)::numeric, 1) AS avg_ai_score,
         MAX(a.ai_score) AS best_ai_score
       FROM users u
       LEFT JOIN applications a ON (a.user_id = u.id OR a.email = u.email)
       WHERE u.role = 'candidate'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    // Interview sessions per candidate
    const interviews = await all<any>(
      `SELECT candidate_id,
              COUNT(*) AS total,
              ROUND(AVG(score)::numeric, 1) AS avg_score,
              MAX(score) AS best_score
       FROM interview_sessions
       WHERE candidate_id IS NOT NULL AND score IS NOT NULL
       GROUP BY candidate_id`
    );
    const interviewMap: Record<string, any> = {};
    interviews.forEach((r: any) => { interviewMap[r.candidate_id] = r; });

    // Quiz results per candidate (from quiz_results table if it exists)
    let quizMap: Record<string, any> = {};
    try {
      const quizzes = await all<any>(
        `SELECT user_id,
                COUNT(*) AS total_attempts,
                ROUND(AVG(score::numeric / NULLIF(total, 0) * 100), 1) AS avg_pct,
                SUM(CASE WHEN passed THEN 1 ELSE 0 END) AS passed_count,
                json_agg(json_build_object(
                  'skill', skill,
                  'score', score,
                  'total', total,
                  'passed', passed,
                  'created_at', created_at
                ) ORDER BY created_at DESC) AS attempts
         FROM quiz_results
         GROUP BY user_id`
      );
      quizzes.forEach((r: any) => { quizMap[r.user_id] = r; });
    } catch {
      // quiz_results table may not exist yet — migration pending
    }

    const result = users.map((u: any) => ({
      ...u,
      avg_ai_score: u.avg_ai_score !== null ? Number(u.avg_ai_score) : null,
      best_ai_score: u.best_ai_score !== null ? Number(u.best_ai_score) : null,
      application_count: Number(u.application_count) || 0,
      verified_skills: Array.isArray(u.verified_skills) ? u.verified_skills : [],
      interview_total: Number(interviewMap[u.id]?.total) || 0,
      interview_avg_score: interviewMap[u.id]?.avg_score != null ? Number(interviewMap[u.id].avg_score) : null,
      interview_best_score: interviewMap[u.id]?.best_score != null ? Number(interviewMap[u.id].best_score) : null,
      quiz_total_attempts: Number(quizMap[u.id]?.total_attempts) || 0,
      quiz_avg_pct: quizMap[u.id]?.avg_pct != null ? Number(quizMap[u.id].avg_pct) : null,
      quiz_passed_count: Number(quizMap[u.id]?.passed_count) || 0,
      quiz_attempts: quizMap[u.id]?.attempts || [],
    }));

    res.json({ candidates: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});



export default router;
