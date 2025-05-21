import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './pool';
import { SecureTenantClient } from './secure-pool';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MigrationMetadata {
  version: string;
  name: string;
  timestamp: Date;
  appliedBy: string;
  status: 'success' | 'failed' | 'rolled-back';
}

export interface MigrationOptions {
  dryRun?: boolean;
  validateOnly?: boolean;
  tenant?: string;
  backupFirst?: boolean;
}

export class MigrationUtils {
  private static async ensureMigrationTrackingTable() {
    // Create legacy migrations table for backward compatibility
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create new detailed migration history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migration_history (
        id SERIAL PRIMARY KEY,
        version VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        applied_by VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL,
        rollback_sql TEXT,
        tenant_id VARCHAR(50)
      );
    `);
  }

  static async createBackup(tenantId?: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filename = tenantId
      ? `backup-${tenantId}-${timestamp}.sql`
      : `backup-${timestamp}.sql`;

    const filePath = path.join(backupDir, filename);

    // Use pg_dump to create backup
    const { exec } = await import('child_process');
    const dbConfig = pool.options;

    const cmd = tenantId
      ? `pg_dump -h ${dbConfig.host} -U ${dbConfig.user} -d ${dbConfig.database} -n tenant_${tenantId} > ${filePath}`
      : `pg_dump -h ${dbConfig.host} -U ${dbConfig.user} -d ${dbConfig.database} > ${filePath}`;

    return new Promise((resolve, reject) => {
      exec(cmd, (error) => {
        if (error) reject(error);
        else resolve(filePath);
      });
    });
  }

  static async validateMigration(sql: string, tenantId?: string) {
    const baseClient = await pool.connect();
    let client: any = baseClient;

    try {
      if (tenantId) {
        client = new SecureTenantClient(baseClient, tenantId);
        // Initialize tenant context
        await client.query('SELECT 1'); // This will trigger session initialization
      }

      await client.query('BEGIN');
      await client.query(sql);
      await client.query('ROLLBACK');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      if (tenantId) {
        await client.release();
      } else {
        baseClient.release();
      }
    }
  }

  static async applyMigration(
    version: string,
    name: string,
    sql: string,
    options: MigrationOptions = {}
  ) {
    await this.ensureMigrationTrackingTable();

    if (options.validateOnly) {
      return this.validateMigration(sql, options.tenant);
    }

    if (options.backupFirst) {
      await this.createBackup(options.tenant);
    }

    const baseClient = await pool.connect();
    let client: any = baseClient;

    try {
      if (options.tenant) {
        client = new SecureTenantClient(baseClient, options.tenant);
        // Initialize tenant context
        await client.query('SELECT 1'); // This will trigger session initialization
      }

      await client.query('BEGIN');

      if (!options.dryRun) {
        await client.query(sql);
      }

      // Record migration in history
      await client.query(
        `INSERT INTO _migration_history (version, name, applied_by, status, tenant_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [version, name, 'system', 'success', options.tenant]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');

      // Record failed migration
      await pool.query(
        `INSERT INTO _migration_history (version, name, applied_by, status, tenant_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [version, name, 'system', 'failed', options.tenant]
      );

      throw error;
    } finally {
      if (options.tenant) {
        await client.release();
      } else {
        baseClient.release();
      }
    }
  }

  static async getMigrationHistory(
    tenantId?: string
  ): Promise<MigrationMetadata[]> {
    await this.ensureMigrationTrackingTable();

    const result = await pool.query(
      `SELECT version, name, timestamp, applied_by, status 
       FROM _migration_history 
       WHERE tenant_id IS NOT DISTINCT FROM $1
       ORDER BY timestamp DESC`,
      [tenantId]
    );

    return result.rows;
  }

  static async restoreBackup(backupPath: string, tenantId?: string) {
    const { exec } = await import('child_process');
    const dbConfig = pool.options;

    const cmd = tenantId
      ? `psql -h ${dbConfig.host} -U ${dbConfig.user} -d ${dbConfig.database} -c "DROP SCHEMA IF EXISTS tenant_${tenantId} CASCADE;" && psql -h ${dbConfig.host} -U ${dbConfig.user} -d ${dbConfig.database} -f ${backupPath}`
      : `psql -h ${dbConfig.host} -U ${dbConfig.user} -d ${dbConfig.database} -f ${backupPath}`;

    return new Promise((resolve, reject) => {
      exec(cmd, (error) => {
        if (error) reject(error);
        else resolve(true);
      });
    });
  }
}
