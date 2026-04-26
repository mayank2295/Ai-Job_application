import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured. Set it in your environment.');
}

const sslRequired =
  process.env.DATABASE_SSL === 'true' || /sslmode=require/i.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (error) => {
  console.error('Postgres pool error:', error);
});

export async function initializeDatabase(): Promise<void> {
  const distSchemaPath = path.join(__dirname, 'schema.sql');
  const srcSchemaPath = path.resolve(__dirname, '..', '..', 'src', 'database', 'schema.sql');
  const schemaPath = fs.existsSync(distSchemaPath) ? distSchemaPath : srcSchemaPath;

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`schema.sql not found at ${distSchemaPath} or ${srcSchemaPath}`);
  }

  const schema = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(schema);
  
  // Add missing columns if they don't exist
  try {
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='job_id') THEN
          ALTER TABLE applications ADD COLUMN job_id TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='user_id') THEN
          ALTER TABLE applications ADD COLUMN user_id TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='phone') THEN
          ALTER TABLE applications ADD COLUMN phone TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='experience_years') THEN
          ALTER TABLE applications ADD COLUMN experience_years INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='cover_letter') THEN
          ALTER TABLE applications ADD COLUMN cover_letter TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='ai_score') THEN
          ALTER TABLE applications ADD COLUMN ai_score REAL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='resume_filename') THEN
          ALTER TABLE applications ADD COLUMN resume_filename TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='resume_path') THEN
          ALTER TABLE applications ADD COLUMN resume_path TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='ai_skills') THEN
          ALTER TABLE applications ADD COLUMN ai_skills TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='ai_missing_skills') THEN
          ALTER TABLE applications ADD COLUMN ai_missing_skills TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='ai_analysis') THEN
          ALTER TABLE applications ADD COLUMN ai_analysis TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='workflow_status') THEN
          ALTER TABLE applications ADD COLUMN workflow_status TEXT DEFAULT 'none' CHECK(workflow_status IN ('none', 'triggered', 'completed', 'failed'));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='resume_url') THEN
          ALTER TABLE applications ADD COLUMN resume_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='notes') THEN
          ALTER TABLE applications ADD COLUMN notes TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='verified_skills') THEN
          ALTER TABLE users ADD COLUMN verified_skills JSONB DEFAULT '[]'::jsonb;
        END IF;
      END $$;
    `);

    // Create chat_sessions table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          bot_type TEXT NOT NULL CHECK(bot_type IN ('careerbot', 'helpbot')),
          title TEXT,
          messages TEXT NOT NULL DEFAULT '[]',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Drop the old FK constraint if it exists (user_id stores Firebase UID, not users.id)
    await pool.query(`
      ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_user_id_fkey;
    `).catch(() => {});

    await pool.query(`
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
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_quizzes (
        token TEXT PRIMARY KEY,
        skill TEXT NOT NULL,
        questions JSONB NOT NULL,
        expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes'),
        used BOOLEAN DEFAULT FALSE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.error('Error running migrations:', err);
  }
  
    // Production features tables
    await pool.query(`
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
    `).catch(() => {});

    await pool.query(`
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
    `).catch(() => {});

    // Reputation + billing columns
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reputation_score') THEN
          ALTER TABLE users ADD COLUMN reputation_score REAL DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reputation_breakdown') THEN
          ALTER TABLE users ADD COLUMN reputation_breakdown JSONB DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='total_applications') THEN
          ALTER TABLE users ADD COLUMN total_applications INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avg_ats_score') THEN
          ALTER TABLE users ADD COLUMN avg_ats_score REAL DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='verified_skills_count') THEN
          ALTER TABLE users ADD COLUMN verified_skills_count INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='subscription_tier') THEN
          ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='razorpay_payment_id') THEN
          ALTER TABLE users ADD COLUMN razorpay_payment_id TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='monthly_ats_scans') THEN
          ALTER TABLE users ADD COLUMN monthly_ats_scans INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='monthly_scans_reset_at') THEN
          ALTER TABLE users ADD COLUMN monthly_scans_reset_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
      END $$;
    `).catch(() => {});

  // Add subscription date columns (idempotent)
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ').catch(() => {});
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ').catch(() => {});

  // Ensure notifications table exists with correct schema and indexes
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id     TEXT NOT NULL,
      type        TEXT NOT NULL DEFAULT 'info',
      title       TEXT NOT NULL,
      message     TEXT NOT NULL,
      is_read     BOOLEAN NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `).catch(() => {});
  await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON notifications(user_id)').catch(() => {});
  await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)').catch(() => {});

  console.log('✅ Database initialized successfully');
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function get<T extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<T | undefined> {
  const result = await pool.query<T>(text, params);
  return result.rows[0];
}

export async function all<T extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function run(text: string, params: any[] = []): Promise<void> {
  await pool.query(text, params);
}

export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
