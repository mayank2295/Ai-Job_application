import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

// Helper: use Firebase UID when available, fall back to IP (IPv6-safe)
function userOrIpKey(prefix: string) {
  return (req: Request): string => {
    const uid = (req as any).user?.uid;
    if (uid) return `${prefix}_${uid}`;
    // Use the library's IPv6-safe helper when falling back to IP
    return `${prefix}_${ipKeyGenerator(req.ip ?? 'unknown')}`;
  };
}

// General API: 100 req / 15 min per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req: Request) => req.path === '/api/health',
});

// AI endpoints: 20 req / min per user
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: userOrIpKey('ai'),
  message: { error: 'AI request limit reached. Please wait a moment.' },
});

// Auth: 10 attempts / 15 min per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts.' },
});

// Heavy AI (cover letter): 5 / hour per user
export const heavyAILimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: userOrIpKey('heavy_ai'),
  message: { error: 'Cover letter generation limit reached. Try again in an hour.' },
});

// Application submit: 10 / hour per user
export const applicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: userOrIpKey('apply'),
  message: { error: 'Application submission limit reached. Try again in an hour.' },
});
