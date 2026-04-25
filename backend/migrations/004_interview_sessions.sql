CREATE TABLE IF NOT EXISTS interview_sessions (
  id TEXT PRIMARY KEY,
  candidate_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  conversation JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INTEGER,
  feedback TEXT,
  strengths TEXT[],
  improvements TEXT[],
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
