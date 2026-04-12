import { Request, Response, NextFunction } from 'express';

/**
 * Simple API key authentication for webhook endpoints.
 * Power Automate flows will send this key in the x-api-key header.
 */
export function webhookAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;
  const expectedKey = process.env.WEBHOOK_API_KEY || 'dev-secret-key-123';

  if (!apiKey || apiKey !== expectedKey) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
    return;
  }
  next();
}
