import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || './data/applications.db';

// Ensure the data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db: DatabaseType = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase(): void {
  const distSchemaPath = path.join(__dirname, 'schema.sql');
  const srcSchemaPath = path.resolve(__dirname, '..', '..', 'src', 'database', 'schema.sql');
  const schemaPath = fs.existsSync(distSchemaPath) ? distSchemaPath : srcSchemaPath;

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`schema.sql not found at ${distSchemaPath} or ${srcSchemaPath}`);
  }

  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('✅ Database initialized successfully');
}

export default db;
