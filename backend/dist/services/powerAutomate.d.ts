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
export declare class PowerAutomateService {
    /**
     * Trigger the "New Application" instant flow.
     * This flow sends a confirmation email and notifies HR on Teams.
     */
    static triggerNewApplicationFlow(applicationData: {
        id: string;
        full_name: string;
        email: string;
        position: string;
        phone?: string;
        created_at: string;
    }): Promise<TriggerResult>;
    /**
     * Trigger the "Resume Analysis" automated flow.
     * In a real setup, this would upload to SharePoint which triggers the flow.
     * Here we directly trigger via HTTP for simplicity.
     */
    static triggerResumeAnalysisFlow(data: {
        applicationId: string;
        resumeFilename: string;
        resumePath: string;
        applicantName: string;
        position: string;
    }): Promise<TriggerResult>;
    /**
     * Log a workflow execution to the database
     */
    private static logWorkflow;
    /**
     * Get a setting value from the database
     */
    private static getSettingValue;
    /**
     * Get all workflow logs (for the dashboard)
     */
    static getWorkflowLogs(limit?: number): any[];
    /**
     * Get workflow stats
     */
    static getWorkflowStats(): any;
}
export {};
//# sourceMappingURL=powerAutomate.d.ts.map