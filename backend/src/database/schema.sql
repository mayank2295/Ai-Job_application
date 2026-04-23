-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    position TEXT NOT NULL,
    experience_years INTEGER DEFAULT 0,
    cover_letter TEXT,
    resume_filename TEXT,
    resume_path TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewing', 'interviewed', 'accepted', 'rejected')),
    ai_analysis TEXT,
    ai_score REAL,
    ai_skills TEXT,
    workflow_status TEXT DEFAULT 'none' CHECK(workflow_status IN ('none', 'triggered', 'completed', 'failed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Workflow execution logs
CREATE TABLE IF NOT EXISTS workflow_logs (
    id TEXT PRIMARY KEY,
    application_id TEXT,
    flow_type TEXT NOT NULL CHECK(flow_type IN ('instant', 'automated', 'scheduled')),
    flow_name TEXT NOT NULL,
    status TEXT DEFAULT 'triggered' CHECK(status IN ('triggered', 'running', 'completed', 'failed')),
    trigger_data TEXT,
    response_data TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Follow-up reminders
CREATE TABLE IF NOT EXISTS follow_ups (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL,
    reminder_type TEXT DEFAULT 'review' CHECK(reminder_type IN ('review', 'interview', 'decision', 'custom')),
    message TEXT,
    scheduled_date DATE NOT NULL,
    is_sent INTEGER DEFAULT 0,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Settings (for Power Automate URLs, etc.)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES ('notification_email', '')
ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('teams_webhook_url', '')
ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('pa_new_application_url', '')
ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('pa_resume_analysis_url', '')
ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('pa_scheduled_flow_enabled', 'false')
ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('auto_trigger_workflows', 'true')
ON CONFLICT (key) DO NOTHING;
