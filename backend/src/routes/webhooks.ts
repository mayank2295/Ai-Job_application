import { Router, Request, Response } from 'express';
import { all, get, run } from '../database/db';
import { webhookAuth } from '../middleware/auth';
import { PowerAutomateService } from '../services/powerAutomate';

const router = Router();

/**
 * POST /api/webhooks/resume-analyzed
 * Called by Power Automate after AI Builder analyzes a resume.
 * Receives the analysis results and updates the application.
 */
router.post('/resume-analyzed', webhookAuth, async (req: Request, res: Response) => {
  try {
    const { applicationId, aiScore, skills, analysis, summary } = req.body;

    if (!applicationId) {
      res.status(400).json({ error: 'applicationId is required' });
      return;
    }

    const application = await get('SELECT * FROM applications WHERE id = $1', [applicationId]);
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    // Update with AI analysis results
    await run(`
      UPDATE applications 
      SET ai_analysis = $1, ai_score = $2, ai_skills = $3, updated_at = $4
      WHERE id = $5
    `, [
      analysis || summary || null,
      aiScore || null,
      skills ? (Array.isArray(skills) ? JSON.stringify(skills) : skills) : null,
      new Date().toISOString(),
      applicationId
    ]);

    // Update the workflow log
    await run(`
      UPDATE workflow_logs 
      SET status = 'completed', completed_at = $1, response_data = $2
      WHERE application_id = $3 AND flow_name = 'Resume Analysis' AND status = 'running'
    `, [new Date().toISOString(), JSON.stringify(req.body), applicationId]);

    console.log(`✅ Resume analysis received for application ${applicationId}: Score ${aiScore}`);
    res.json({ message: 'Resume analysis stored successfully' });
  } catch (error: any) {
    console.error('Error processing resume analysis webhook:', error);
    res.status(500).json({ error: 'Failed to process analysis' });
  }
});

/**
 * POST /api/webhooks/status-update
 * Called by Power Automate to update application status.
 */
router.post('/status-update', webhookAuth, async (req: Request, res: Response) => {
  try {
    const { applicationId, status, notes } = req.body;
    const validStatuses = ['pending', 'reviewing', 'shortlisted', 'interviewed', 'accepted', 'rejected'];

    if (!applicationId || !status || !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Valid applicationId and status are required' });
      return;
    }

    await run(`
      UPDATE applications SET status = $1, notes = COALESCE($2, notes), updated_at = $3 WHERE id = $4
    `, [status, notes || null, new Date().toISOString(), applicationId]);

    res.json({ message: 'Status updated successfully' });
  } catch (error: any) {
    console.error('Error processing status update webhook:', error);
    res.status(500).json({ error: 'Failed to process status update' });
  }
});

/**
 * GET /api/webhooks/pending-followups
 * Called by the Scheduled Power Automate flow to get applications needing follow-up.
 * Returns all pending applications older than 3 days.
 */
router.get('/pending-followups', webhookAuth, async (_req: Request, res: Response) => {
  try {
    const pendingApps = await all(`
      SELECT id, full_name, email, position, status, created_at, 
             EXTRACT(DAY FROM (NOW() - created_at))::int as days_pending
      FROM applications 
      WHERE status IN ('pending', 'reviewing') 
        AND created_at <= NOW() - INTERVAL '3 days'
      ORDER BY created_at ASC
    `);

    res.json({
      count: pendingApps.length,
      applications: pendingApps,
      fetchedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error fetching pending followups:', error);
    res.status(500).json({ error: 'Failed to fetch pending followups' });
  }
});

/**
 * GET /api/webhooks/workflow-logs - Get workflow execution logs
 */
router.get('/workflow-logs', async (_req: Request, res: Response) => {
  try {
    const logs = await PowerAutomateService.getWorkflowLogs();
    const stats = await PowerAutomateService.getWorkflowStats();
    res.json({ logs, stats });
  } catch (error: any) {
    console.error('Error fetching workflow logs:', error);
    res.status(500).json({ error: 'Failed to fetch workflow logs' });
  }
});

/**
 * POST /api/webhooks/test-trigger - Test trigger for debugging
 */
router.post('/test-trigger', async (req: Request, res: Response) => {
  try {
    const { flowType } = req.body;

    if (flowType === 'instant') {
      const result = await PowerAutomateService.triggerNewApplicationFlow({
        id: 'test-' + Date.now(),
        full_name: 'Test Applicant',
        email: 'test@example.com',
        position: 'Software Engineer',
        phone: '+1234567890',
        created_at: new Date().toISOString()
      });
      res.json({ message: 'Test trigger sent', result });
    } else {
      res.json({ message: 'Flow type not supported for testing yet', flowType });
    }
  } catch (error: any) {
    console.error('Error in test trigger:', error);
    res.status(500).json({ error: 'Test trigger failed' });
  }
});

export default router;
