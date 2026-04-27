-- Migration 009: Store quiz attempt results for admin analytics
CREATE TABLE IF NOT EXISTS quiz_results (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill       TEXT NOT NULL,
  score       INTEGER NOT NULL,        -- number correct (e.g. 7)
  total       INTEGER NOT NULL,        -- total questions (e.g. 10)
  passed      BOOLEAN NOT NULL,
  answers     JSONB DEFAULT '[]',      -- array of selected option indices
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_created_at ON quiz_results(created_at DESC);
