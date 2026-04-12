export interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  position: string;
  experience_years: number;
  cover_letter: string | null;
  resume_filename: string | null;
  resume_path: string | null;
  status: 'pending' | 'reviewing' | 'interviewed' | 'accepted' | 'rejected';
  ai_analysis: string | null;
  ai_score: number | null;
  ai_skills: string | null;
  workflow_status: 'none' | 'triggered' | 'completed' | 'failed';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowLog {
  id: string;
  application_id: string | null;
  flow_type: 'instant' | 'automated' | 'scheduled';
  flow_name: string;
  status: 'triggered' | 'running' | 'completed' | 'failed';
  trigger_data: string | null;
  response_data: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  applicant_name?: string;
  position?: string;
}

export interface FollowUp {
  id: string;
  application_id: string;
  reminder_type: 'review' | 'interview' | 'decision' | 'custom';
  message: string | null;
  scheduled_date: string;
  is_sent: number;
  sent_at: string | null;
  created_at: string;
}

export interface DashboardStats {
  total: number;
  pending: number;
  reviewing: number;
  interviewed: number;
  accepted: number;
  rejected: number;
  avg_ai_score: number | null;
}

export interface WorkflowStats {
  flow_type: string;
  total: number;
  completed: number;
  failed: number;
  running: number;
}

export interface Settings {
  notification_email: string;
  teams_webhook_url: string;
  pa_new_application_url: string;
  pa_resume_analysis_url: string;
  pa_scheduled_flow_enabled: string;
  auto_trigger_workflows: string;
  [key: string]: string;
}

export interface ApplicationFormData {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  experience_years: number;
  cover_letter: string;
}
