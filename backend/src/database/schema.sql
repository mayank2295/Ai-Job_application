-- Users table (synced from Firebase Auth)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    firebase_uid TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    photo_url TEXT,
    role TEXT NOT NULL DEFAULT 'candidate' CHECK(role IN ('admin', 'candidate')),
    phone TEXT,
    resume_url TEXT,
    skills TEXT DEFAULT '',
    headline TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table (posted by admin)
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL DEFAULT 'JobFlow Inc.',
    location TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Full-Time' CHECK(type IN ('Full-Time', 'Part-Time', 'Remote', 'Internship', 'Contract')),
    description TEXT NOT NULL,
    requirements TEXT NOT NULL DEFAULT '[]',
    salary_range TEXT DEFAULT '',
    department TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    applicant_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Applications table (linked to jobs and users)
CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    job_id TEXT,
    user_id TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    position TEXT NOT NULL,
    experience_years INTEGER DEFAULT 0,
    cover_letter TEXT,
    resume_filename TEXT,
    resume_path TEXT,
    resume_url TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewing', 'shortlisted', 'interviewed', 'accepted', 'rejected')),
    ai_analysis TEXT,
    ai_score REAL,
    ai_skills TEXT,
    ai_missing_skills TEXT,
    workflow_status TEXT DEFAULT 'none' CHECK(workflow_status IN ('none', 'triggered', 'completed', 'failed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
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

-- Settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Default settings
INSERT INTO settings (key, value) VALUES ('notification_email', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('teams_webhook_url', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('pa_new_application_url', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('pa_resume_analysis_url', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('pa_scheduled_flow_enabled', 'false') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('auto_trigger_workflows', 'true') ON CONFLICT (key) DO NOTHING;

-- Seed example jobs (only if jobs table is empty)
INSERT INTO jobs (id, title, company, location, type, description, requirements, salary_range, department, is_active)
SELECT 'job-001', 'Senior Software Engineer', 'JobFlow Inc.', 'Bangalore, India', 'Full-Time',
  'We are looking for a passionate Senior Software Engineer to join our core platform team. You will design and build scalable backend systems, mentor junior engineers, and contribute to our product roadmap.',
  '["5+ years of experience in Node.js or Python", "Strong knowledge of PostgreSQL / databases", "Experience with cloud platforms (AWS/GCP/Azure)", "Familiarity with Docker and CI/CD pipelines", "Excellent problem-solving skills"]',
  '₹25L – ₹35L per annum', 'Engineering', TRUE
WHERE NOT EXISTS (SELECT 1 FROM jobs LIMIT 1);

INSERT INTO jobs (id, title, company, location, type, description, requirements, salary_range, department, is_active)
SELECT 'job-002', 'Product Manager', 'JobFlow Inc.', 'Mumbai, India', 'Full-Time',
  'We are seeking an experienced Product Manager to drive the vision, strategy, and roadmap for our AI-powered hiring platform. You will work closely with engineering, design, and business teams.',
  '["3+ years of product management experience", "Strong analytical and data-driven decision making", "Experience with Agile/Scrum methodologies", "Excellent written and verbal communication", "Prior experience in HR-Tech or SaaS is a plus"]',
  '₹20L – ₹30L per annum', 'Product', TRUE
WHERE NOT EXISTS (SELECT 1 FROM jobs WHERE id = 'job-002');

INSERT INTO jobs (id, title, company, location, type, description, requirements, salary_range, department, is_active)
SELECT 'job-003', 'UI/UX Designer', 'JobFlow Inc.', 'Remote', 'Remote',
  'Join our design team to create beautiful, intuitive user experiences for our hiring platform used by thousands of candidates and recruiters. You will own the end-to-end design process.',
  '["3+ years of UI/UX design experience", "Proficiency in Figma or Adobe XD", "Strong portfolio demonstrating product design work", "Understanding of accessibility standards", "Experience conducting user research"]',
  '₹15L – ₹22L per annum', 'Design', TRUE
WHERE NOT EXISTS (SELECT 1 FROM jobs WHERE id = 'job-003');

INSERT INTO jobs (id, title, company, location, type, description, requirements, salary_range, department, is_active)
SELECT 'job-004', 'Data Analyst', 'JobFlow Inc.', 'Hyderabad, India', 'Full-Time',
  'We are looking for a detail-oriented Data Analyst to help us turn raw hiring data into meaningful insights. You will build dashboards, analyze trends, and drive data-informed decisions across the company.',
  '["2+ years of experience in data analysis", "Proficiency in SQL and Excel/Google Sheets", "Experience with BI tools (Tableau, Power BI, or Metabase)", "Strong statistical analysis skills", "Python or R is a plus"]',
  '₹12L – ₹18L per annum', 'Analytics', TRUE
WHERE NOT EXISTS (SELECT 1 FROM jobs WHERE id = 'job-004');

INSERT INTO jobs (id, title, company, location, type, description, requirements, salary_range, department, is_active)
SELECT 'job-005', 'Frontend Developer (React)', 'JobFlow Inc.', 'Pune, India', 'Full-Time',
  'We are looking for a talented React developer to build world-class user interfaces for our platform. You will work closely with designers and backend engineers to deliver exceptional user experiences.',
  '["3+ years of experience with React.js", "Strong proficiency in TypeScript", "Experience with REST APIs and state management (Redux/Zustand)", "Understanding of CSS and responsive design", "Experience with testing frameworks (Jest, RTL)"]',
  '₹18L – ₹28L per annum', 'Engineering', TRUE
WHERE NOT EXISTS (SELECT 1 FROM jobs WHERE id = 'job-005');

-- Chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    bot_type TEXT NOT NULL CHECK(bot_type IN ('careerbot', 'helpbot')),
    title TEXT,
    messages TEXT NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

