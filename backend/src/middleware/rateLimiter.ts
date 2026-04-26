import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

const isDev = process.env.NODE_ENV !== 'production';

// Helper: use Firebase UID when available, fall back to IP (IPv6-safe)
function userOrIpKey(prefix: string) {
  return (req: Request): string => {
    const uid = (req as any).user?.uid;
    if (uid) return `${prefix}_${uid}`;
    return `${prefix}_${ipKeyGenerator(req.ip ?? 'unknown')}`;
  };
}

// Routes that should never be rate-limited (lightweight reads)
const SKIP_PATHS = ['/api/health', '/api/billing/status', '/api/billing/plans'];

// General API: 300 req / 15 min per IP (relaxed for dev)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req: Request) => SKIP_PATHS.some(p => req.path.startsWith(p.replace('/api', ''))),
});

// AI endpoints: 20 req / min per user (50 in dev)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 50 : 20,
  keyGenerator: userOrIpKey('ai'),
  message: { error: 'AI request limit reached. Please wait a moment.' },
});

// Auth: 10 attempts / 15 min per IP (50 in dev)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 50 : 10,
  message: { error: 'Too many login attempts.' },
});

// Heavy AI (cover letter): 5 / hour per user (20 in dev)
export const heavyAILimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 20 : 5,
  keyGenerator: userOrIpKey('heavy_ai'),
  message: { error: 'Cover letter generation limit reached. Try again in an hour.' },
});

// Application submit: 10 / hour per user (50 in dev)
export const applicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 50 : 10,
  keyGenerator: userOrIpKey('apply'),
  message: { error: 'Application submission limit reached. Try again in an hour.' },
});
