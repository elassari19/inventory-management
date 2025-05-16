import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './pool';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, '../../migrations');

// Function to run all migrations
export const runMigrations = async () => {
  try {
    console.log('Running database migrations...');

    // Get all SQL files from migrations directory
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort(); // Sort to ensure migrations run in order

    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check which migrations have been applied
    const result = await pool.query('SELECT name FROM migrations');
    const appliedMigrations = result.rows.map((row) => row.name);

    // Run each migration file
    for (const file of files) {
      if (appliedMigrations.includes(file)) {
        console.log(`Migration ${file} already applied, skipping`);
        continue;
      }

      console.log(`Applying migration: ${file}`);

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      // Begin transaction
      await pool.query('BEGIN');

      try {
        // Run the migration
        await pool.query(sql);

        // Record that the migration has been applied
        await pool.query('INSERT INTO migrations (name) VALUES ($1)', [file]);

        // Commit transaction
        await pool.query('COMMIT');

        console.log(`Migration ${file} applied successfully`);
      } catch (error) {
        // Rollback transaction on error
        await pool.query('ROLLBACK');
        console.error(`Error applying migration ${file}:`, error);
        throw error;
      }
    }

    console.log('All migrations applied successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
};

// Run migrations if this file is executed directly
if (process.argv[1] === __filename) {
  runMigrations()
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration process failed:', err);
      process.exit(1);
    });
}

export default { runMigrations };
