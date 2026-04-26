-- Production features migration
-- Run once against your PostgreSQL database

-- Audit logs (GDPR compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Deletion requests (GDPR Art. 17)
CREATE TABLE IF NOT EXISTS deletion_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  firebase_uid TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- Reputation score columns on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_score REAL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_breakdown JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_applications INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avg_ats_score REAL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_skills_count INTEGER DEFAULT 0;

-- Billing columns on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_ats_scans INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_scans_reset_at TIMESTAMPTZ DEFAULT NOW();
