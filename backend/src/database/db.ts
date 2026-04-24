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
