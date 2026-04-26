import { Request, Response, NextFunction } from 'express';
import { run } from '../database/db';

export function auditLog(entityType: string, action: string) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.on('finish', async () => {
      if (res.statusCode >= 400) return;
      try {
        const req = _req;
        const uid = (req as any).user?.uid || 'anonymous';
        const entityId = req.params.id || req.params.applicationId || '';
        await run(
          `INSERT INTO audit_logs (user_id, entity_type, entity_id, action, details, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            uid, entityType, entityId, action,
            JSON.stringify({ method: req.method, path: req.path }),
            req.ip,
            req.headers['user-agent'],
          ]
        );
      } catch {} // never break requests
    });
    next();
  };
}
