import Database, { type Database as DatabaseType } from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// Create database connection
const DB_FILE = process.env.DB_FILE as string;
if (!DB_FILE) throw new Error('DB_FILE environment variable is required');
const sqlite = new Database(DB_FILE);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Export a typed version of the database instance for direct access if needed
export const rawDb: DatabaseType = sqlite;
