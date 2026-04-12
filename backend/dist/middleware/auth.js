"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookAuth = webhookAuth;
/**
 * Simple API key authentication for webhook endpoints.
 * Power Automate flows will send this key in the x-api-key header.
 */
function webhookAuth(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.WEBHOOK_API_KEY || 'dev-secret-key-123';
    if (!apiKey || apiKey !== expectedKey) {
        res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map