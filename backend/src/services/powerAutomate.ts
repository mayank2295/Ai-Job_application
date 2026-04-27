import { all, get, run } from '../database/db';
import { v4 as uuidv4 } from 'uuid';

interface TriggerResult {
  success: boolean;
  flowRunId?: string;
  error?: string;
}

/**
 * Power Automate Integration Service
 * 
 * This service handles all communication with Power Automate flows.
 * It sends HTTP POST requests to Power Automate HTTP trigger URLs
 * and logs all workflow executions.
 */
export class PowerAutomateService {

  /**
   * Trigger the "New Application" instant flow.
   * This flow sends a confirmation email and notifies HR on Teams.
   */
  static async triggerNewApplicationFlow(applicationData: {
    id: string;
    full_name: string;
    email: string;
    position: string;
    phone?: string;
    created_at: string;
  }): Promise<TriggerResult> {
    const flowUrl = (await this.getSettingValue('pa_new_application_url')) || process.env.PA_NEW_APPLICATION_FLOW_URL;

    if (!flowUrl || flowUrl.trim() === '') {
      // n8n not configured — emails are sent via SendGrid directly in applications.ts
      return { success: false, error: 'Flow URL not configured' };
    }

    try {
      console.log(`🔄 Triggering New Application flow for: ${applicationData.full_name}`);

      const response = await fetch(flowUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: applicationData.id,
          applicantName: applicationData.full_name,
          applicantEmail: applicationData.email,
          position: applicationData.position,
          phone: applicationData.phone || '',
          appliedAt: applicationData.created_at,
          dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/applications/${applicationData.id}`
        })
      });

      const responseData = await response.text();
      
      if (response.ok) {
        console.log(`✅ New Application flow triggered successfully`);
        await this.logWorkflow(applicationData.id, 'instant', 'New Application Notification', 'completed', applicationData, responseData);
        
        // Update application workflow status
        await run('UPDATE applications SET workflow_status = $1 WHERE id = $2', ['completed', applicationData.id]);
        
        return { success: true, flowRunId: response.headers.get('x-ms-workflow-run-id') || undefined };
      } else {
        throw new Error(`HTTP ${response.status}: ${responseData}`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to trigger New Application flow:`, error.message);
      await this.logWorkflow(applicationData.id, 'instant', 'New Application Notification', 'failed', applicationData, null, error.message);
      
      await run('UPDATE applications SET workflow_status = $1 WHERE id = $2', ['failed', applicationData.id]);
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger the "Resume Analysis" automated flow.
   * In a real setup, this would upload to SharePoint which triggers the flow.
   * Here we directly trigger via HTTP for simplicity.
   */
  static async triggerResumeAnalysisFlow(data: {
    applicationId: string;
    resumeFilename: string;
    resumePath: string;
    applicantName: string;
    position: string;
  }): Promise<TriggerResult> {
    const flowUrl = (await this.getSettingValue('pa_resume_analysis_url')) || process.env.PA_RESUME_ANALYSIS_FLOW_URL;

    if (!flowUrl) {
      console.log('⚠️  Power Automate URL not configured for Resume Analysis flow. Skipping trigger.');
      await this.logWorkflow(data.applicationId, 'automated', 'Resume Analysis', 'failed', null, null, 'Flow URL not configured');
      return { success: false, error: 'Flow URL not configured' };
    }

    try {
      console.log(`🔄 Triggering Resume Analysis flow for: ${data.applicantName}`);

      const response = await fetch(flowUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: data.applicationId,
          resumeFilename: data.resumeFilename,
          resumeUrl: data.resumePath,
          applicantName: data.applicantName,
          position: data.position,
          callbackUrl: `${process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace('5173', '3001') : 'http://localhost:3001'}/api/webhooks/resume-analyzed`
        })
      });

      if (response.ok) {
        console.log(`✅ Resume Analysis flow triggered successfully`);
        await this.logWorkflow(data.applicationId, 'automated', 'Resume Analysis', 'running', data);
        return { success: true };
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to trigger Resume Analysis flow:`, error.message);
      await this.logWorkflow(data.applicationId, 'automated', 'Resume Analysis', 'failed', data, null, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log a workflow execution to the database
   */
  private static async logWorkflow(
    applicationId: string | null,
    flowType: 'instant' | 'automated' | 'scheduled',
    flowName: string,
    status: 'triggered' | 'running' | 'completed' | 'failed',
    triggerData?: any,
    responseData?: any,
    errorMessage?: string
  ): Promise<void> {
    await run(`
      INSERT INTO workflow_logs (id, application_id, flow_type, flow_name, status, trigger_data, response_data, error_message, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      uuidv4(),
      applicationId,
      flowType,
      flowName,
      status,
      triggerData ? JSON.stringify(triggerData) : null,
      responseData ? (typeof responseData === 'string' ? responseData : JSON.stringify(responseData)) : null,
      errorMessage || null,
      status === 'completed' || status === 'failed' ? new Date().toISOString() : null
    ]);
  }

  /**
   * Get a setting value from the database
   */
  private static async getSettingValue(key: string): Promise<string | null> {
    const row = await get<{ value: string }>('SELECT value FROM settings WHERE key = $1', [key]);
    return row?.value || null;
  }

  /**
   * Get all workflow logs (for the dashboard)
   */
  static async getWorkflowLogs(limit: number = 50): Promise<any[]> {
    return all(`
      SELECT wl.*, a.full_name as applicant_name, a.position
      FROM workflow_logs wl
      LEFT JOIN applications a ON wl.application_id = a.id
      ORDER BY wl.created_at DESC
      LIMIT $1
    `, [limit]);
  }

  /**
   * Get workflow stats
   */
  static async getWorkflowStats(): Promise<any[]> {
    const stats = await all(`
      SELECT 
        flow_type,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running
      FROM workflow_logs
      GROUP BY flow_type
    `);
    return stats;
  }
}
