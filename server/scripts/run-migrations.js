#!/usr/bin/env node

/**
 * Database migration script
 * This script runs the database migrations to setup or update the schema
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Get database config from environment variables or use defaults
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ventory',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

// Create PostgreSQL connection pool
const pool = new Pool(dbConfig);

// Path to migrations directory
const migrationsDir = path.join(__dirname, '../migrations');

// Function to run migrations
async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('Running database migrations...');

    // Start transaction
    await client.query('BEGIN');

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get applied migrations
    const { rows } = await client.query('SELECT name FROM migrations');
    const appliedMigrations = rows.map((row) => row.name);

    // Get all SQL files from migrations directory
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort(); // Sort to ensure migrations run in order

    // Run each migration that hasn't been applied yet
    for (const file of files) {
      if (!appliedMigrations.includes(file)) {
        console.log(`Applying migration: ${file}`);

        // Read and execute migration file
        const migration = fs.readFileSync(
          path.join(migrationsDir, file),
          'utf8'
        );
        await client.query(migration);

        // Record migration as applied
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);

        console.log(`Migration applied: ${file}`);
      } else {
        console.log(`Migration already applied: ${file}`);
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('All migrations applied successfully');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error applying migrations:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('Starting database migrations...');

runMigrations()
  .then(() => {
    console.log('✅ Database migrations completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database migrations failed:', error);
    process.exit(1);
  });
