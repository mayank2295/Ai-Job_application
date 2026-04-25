ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_skills JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS pending_quizzes (
  token TEXT PRIMARY KEY,
  skill TEXT NOT NULL,
  questions JSONB NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 minutes',
  used BOOLEAN DEFAULT FALSE
);
