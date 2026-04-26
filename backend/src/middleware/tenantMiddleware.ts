import { Request, Response, NextFunction } from 'express';
import { get, query as dbQuery } from '../database/db';

// Attach company context to every authenticated admin request
export const requireCompanyContext = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const uid = (req as any).user?.uid;
    if (!uid) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const user = await get<any>(
      `SELECT u.*, c.subscription_tier as company_tier, c.max_job_postings, c.max_recruiter_seats
       FROM users u LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.firebase_uid = $1`,
      [uid]
    );

    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    (req as any).dbUser = user;
    (req as any).companyId = user.company_id;
    next();
  } catch (err) {
    next(err);
  }
};

// Enforce job posting limits per subscription tier
export const enforceJobLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const companyId = (req as any).companyId;
    if (!companyId) { next(); return; }

    const [company, jobCount] = await Promise.all([
      get<any>('SELECT max_job_postings FROM companies WHERE id = $1', [companyId]),
      dbQuery<{ count: string }>('SELECT COUNT(*) as count FROM jobs WHERE company_id = $1 AND is_active = true', [companyId]),
    ]);

    const limit = company?.max_job_postings || 3;
    const current = parseInt(jobCount.rows[0]?.count || '0');

    if (current >= limit) {
      res.status(403).json({
        error: `Job posting limit reached (${current}/${limit}). Upgrade your plan to post more jobs.`,
        upgrade_url: '/billing',
      });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
};

// Enforce ATS scan limits for free tier candidates
export const enforceATSLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const uid = (req as any).user?.uid;
    if (!uid) { next(); return; }

    const user = await get<any>(
      'SELECT subscription_tier, monthly_ats_scans, monthly_scans_reset_at FROM users WHERE firebase_uid = $1',
      [uid]
    );

    if (!user) { next(); return; }

    // Reset monthly counter if month has changed
    const resetDate = new Date(user.monthly_scans_reset_at);
    const now = new Date();
    if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
      await dbQuery(
        'UPDATE users SET monthly_ats_scans = 0, monthly_scans_reset_at = NOW() WHERE firebase_uid = $1',
        [uid]
      );
      user.monthly_ats_scans = 0;
    }

    // Free tier: 3 scans/month
    if (user.subscription_tier === 'free' && user.monthly_ats_scans >= 3) {
      res.status(403).json({
        error: 'Free tier ATS scan limit reached (3/month). Upgrade to Pro for unlimited scans.',
        upgrade_url: '/billing',
        scans_used: user.monthly_ats_scans,
        scans_limit: 3,
      });
      return;
    }

    // Increment counter
    await dbQuery('UPDATE users SET monthly_ats_scans = monthly_ats_scans + 1 WHERE firebase_uid = $1', [uid]);
    next();
  } catch (err) {
    next(err);
  }
};
