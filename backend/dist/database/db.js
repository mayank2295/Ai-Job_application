"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const DB_PATH = process.env.DB_PATH || './data/applications.db';
// Ensure the data directory exists
const dataDir = path_1.default.dirname(DB_PATH);
if (!fs_1.default.existsSync(dataDir)) {
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
const db = new better_sqlite3_1.default(DB_PATH);
// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
function initializeDatabase() {
    const distSchemaPath = path_1.default.join(__dirname, 'schema.sql');
    const srcSchemaPath = path_1.default.resolve(__dirname, '..', '..', 'src', 'database', 'schema.sql');
    const schemaPath = fs_1.default.existsSync(distSchemaPath) ? distSchemaPath : srcSchemaPath;
    if (!fs_1.default.existsSync(schemaPath)) {
        throw new Error(`schema.sql not found at ${distSchemaPath} or ${srcSchemaPath}`);
    }
    const schema = fs_1.default.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
    console.log('✅ Database initialized successfully');
}
exports.default = db;
//# sourceMappingURL=db.js.map