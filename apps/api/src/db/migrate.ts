import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, rawDb } from './index';

console.log('Running migrations...');

migrate(db, { migrationsFolder: './src/db/migrations' });

console.log('Migrations completed successfully!');

// Close the database connection
rawDb.close();
