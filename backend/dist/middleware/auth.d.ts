import { Request, Response, NextFunction } from 'express';
/**
 * Simple API key authentication for webhook endpoints.
 * Power Automate flows will send this key in the x-api-key header.
 */
export declare function webhookAuth(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map