import { Router, Request, Response } from 'express';
import { query } from '../database/db';
import { sendStatusUpdateEmail } from '../services/emailService';

const router = Router();
const startTime = Date.now();

// GET /api/health — basic (load balancer ping)
router.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/health/detailed — full system status
router.get('/detailed', async (_req: Request, res: Response) => {
  const checks: Record<string, any> = {};
  let overallHealthy = true;

  // 1. Database
  try {
    const start = Date.now();
    await query('SELECT 1');
    checks.database = { status: 'ok', latency_ms: Date.now() - start };
  } catch (err: any) {
    checks.database = { status: 'error', error: err.message };
    overallHealthy = false;
  }

  // 2. OpenRouter
  try {
    const start = Date.now();
    const r = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    checks.openrouter = { status: r.ok ? 'ok' : 'degraded', latency_ms: Date.now() - start };
  } catch {
    checks.openrouter = { status: 'error' };
  }

  // 3. Cloudinary
  checks.cloudinary = {
    status: process.env.CLOUDINARY_URL ? 'configured' : 'missing_config',
  };

  // 4. Ollama (if enabled)
  if (process.env.OLLAMA_ENABLED === 'true') {
    try {
      const start = Date.now();
      const r = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      const data = await r.json() as { models?: { name: string }[] };
      checks.ollama = {
        status: r.ok ? 'ok' : 'error',
        latency_ms: Date.now() - start,
        models: data.models?.map((m) => m.name) || [],
      };
    } catch (err: any) {
      checks.ollama = { status: 'error', error: err.message };
    }
  }

  // 5. App stats
  try {
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM applications) as total_applications,
        (SELECT COUNT(*) FROM jobs WHERE is_active = true) as active_jobs,
        (SELECT COUNT(*) FROM applications WHERE created_at > NOW() - INTERVAL '24 hours') as apps_last_24h
    `);
    checks.stats = stats.rows[0];
  } catch {}

  res.status(overallHealthy ? 200 : 503).json({
    status: overallHealthy ? 'healthy' : 'degraded',
    version: '1.0.0',
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    checks,
  });
});

// POST /api/health/test-email — send a test email to verify SendGrid config
router.post('/test-email', async (req: Request, res: Response): Promise<void> => {
  const to = req.body?.to || process.env.HR_NOTIFICATION_EMAIL || process.env.SENDGRID_FROM_EMAIL;

  if (!to) {
    res.status(400).json({ error: 'No recipient. Pass { "to": "email" } in body or set HR_NOTIFICATION_EMAIL in .env' });
    return;
  }

  if (!process.env.SENDGRID_API_KEY) {
    res.status(503).json({ error: 'SENDGRID_API_KEY is not set in .env' });
    return;
  }

  try {
    await sendStatusUpdateEmail(to, 'Test User', 'Software Engineer', 'accepted');
    res.json({
      success: true,
      message: `Test email sent to ${to}`,
      from: process.env.SENDGRID_FROM_EMAIL,
    });
  } catch (err: any) {
    const detail = err?.response?.body?.errors?.[0]?.message || err?.message || 'Unknown error';
    res.status(500).json({ success: false, error: detail });
  }
});

export default router;
