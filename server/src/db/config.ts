/**
 * PostgreSQL Database Configuration
 * Multi-tenant setup for Ventory application
 */

import dotenv from 'dotenv';
import { Pool, PoolConfig } from 'pg';

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig: PoolConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ventory',
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(
    process.env.DB_CONNECTION_TIMEOUT || '2000'
  ),
};

// Create and export the database pool
const pool = new Pool(dbConfig);

// Handle unexpected errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
