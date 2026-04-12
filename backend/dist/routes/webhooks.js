"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../database/db"));
const auth_1 = require("../middleware/auth");
const powerAutomate_1 = require("../services/powerAutomate");
const router = (0, express_1.Router)();
/**
 * POST /api/webhooks/resume-analyzed
 * Called by Power Automate after AI Builder analyzes a resume.
 * Receives the analysis results and updates the application.
 */
router.post('/resume-analyzed', auth_1.webhookAuth, (req, res) => {
    try {
        const { applicationId, aiScore, skills, analysis, summary } = req.body;
        if (!applicationId) {
            res.status(400).json({ error: 'applicationId is required' });
            return;
        }
        const application = db_1.default.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId);
        if (!application) {
            res.status(404).json({ error: 'Application not found' });
            return;
        }
        // Update with AI analysis results
        db_1.default.prepare(`
      UPDATE applications 
      SET ai_analysis = ?, ai_score = ?, ai_skills = ?, updated_at = ?
      WHERE id = ?
    `).run(analysis || summary || null, aiScore || null, skills ? (Array.isArray(skills) ? JSON.stringify(skills) : skills) : null, new Date().toISOString(), applicationId);
        // Update the workflow log
        db_1.default.prepare(`
      UPDATE workflow_logs 
      SET status = 'completed', completed_at = ?, response_data = ?
      WHERE application_id = ? AND flow_name = 'Resume Analysis' AND status = 'running'
    `).run(new Date().toISOString(), JSON.stringify(req.body), applicationId);
        console.log(`✅ Resume analysis received for application ${applicationId}: Score ${aiScore}`);
        res.json({ message: 'Resume analysis stored successfully' });
    }
    catch (error) {
        console.error('Error processing resume analysis webhook:', error);
        res.status(500).json({ error: 'Failed to process analysis' });
    }
});
/**
 * POST /api/webhooks/status-update
 * Called by Power Automate to update application status.
 */
router.post('/status-update', auth_1.webhookAuth, (req, res) => {
    try {
        const { applicationId, status, notes } = req.body;
        const validStatuses = ['pending', 'reviewing', 'interviewed', 'accepted', 'rejected'];
        if (!applicationId || !status || !validStatuses.includes(status)) {
            res.status(400).json({ error: 'Valid applicationId and status are required' });
            return;
        }
        db_1.default.prepare(`
      UPDATE applications SET status = ?, notes = COALESCE(?, notes), updated_at = ? WHERE id = ?
    `).run(status, notes || null, new Date().toISOString(), applicationId);
        res.json({ message: 'Status updated successfully' });
    }
    catch (error) {
        console.error('Error processing status update webhook:', error);
        res.status(500).json({ error: 'Failed to process status update' });
    }
});
/**
 * GET /api/webhooks/pending-followups
 * Called by the Scheduled Power Automate flow to get applications needing follow-up.
 * Returns all pending applications older than 3 days.
 */
router.get('/pending-followups', auth_1.webhookAuth, (_req, res) => {
    try {
        const pendingApps = db_1.default.prepare(`
      SELECT id, full_name, email, position, status, created_at, 
             CAST((julianday('now') - julianday(created_at)) AS INTEGER) as days_pending
      FROM applications 
      WHERE status IN ('pending', 'reviewing') 
        AND created_at <= datetime('now', '-3 days')
      ORDER BY created_at ASC
    `).all();
        res.json({
            count: pendingApps.length,
            applications: pendingApps,
            fetchedAt: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error fetching pending followups:', error);
        res.status(500).json({ error: 'Failed to fetch pending followups' });
    }
});
/**
 * GET /api/webhooks/workflow-logs - Get workflow execution logs
 */
router.get('/workflow-logs', (_req, res) => {
    try {
        const logs = powerAutomate_1.PowerAutomateService.getWorkflowLogs();
        const stats = powerAutomate_1.PowerAutomateService.getWorkflowStats();
        res.json({ logs, stats });
    }
    catch (error) {
        console.error('Error fetching workflow logs:', error);
        res.status(500).json({ error: 'Failed to fetch workflow logs' });
    }
});
/**
 * POST /api/webhooks/test-trigger - Test trigger for debugging
 */
router.post('/test-trigger', async (req, res) => {
    try {
        const { flowType } = req.body;
        if (flowType === 'instant') {
            const result = await powerAutomate_1.PowerAutomateService.triggerNewApplicationFlow({
                id: 'test-' + Date.now(),
                full_name: 'Test Applicant',
                email: 'test@example.com',
                position: 'Software Engineer',
                phone: '+1234567890',
                created_at: new Date().toISOString()
            });
            res.json({ message: 'Test trigger sent', result });
        }
        else {
            res.json({ message: 'Flow type not supported for testing yet', flowType });
        }
    }
    catch (error) {
        console.error('Error in test trigger:', error);
        res.status(500).json({ error: 'Test trigger failed' });
    }
});
exports.default = router;
//# sourceMappingURL=webhooks.js.map