#!/usr/bin/env node

/**
 * Data Migration Utility CLI
 * This script provides utilities for managing database migrations, backups, and tenant data
 */

import { program } from 'commander';
import { MigrationUtils } from '../src/db/migration-utils';
import { runMigrations } from '../src/db/migrations';
import fs from 'fs';
import path from 'path';

program.version('1.0.0').description('Data migration utilities for Ventory');

program
  .command('status')
  .description('Show migration status')
  .option('-t, --tenant <tenantId>', 'Tenant ID')
  .action(async (options) => {
    try {
      const history = await MigrationUtils.getMigrationHistory(options.tenant);
      console.table(history);
    } catch (error) {
      console.error('Error getting migration status:', error);
      process.exit(1);
    }
  });

program
  .command('backup')
  .description('Create a database backup')
  .option('-t, --tenant <tenantId>', 'Tenant ID')
  .action(async (options) => {
    try {
      const backupPath = await MigrationUtils.createBackup(options.tenant);
      console.log(`Backup created at: ${backupPath}`);
    } catch (error) {
      console.error('Error creating backup:', error);
      process.exit(1);
    }
  });

program
  .command('restore <backupPath>')
  .description('Restore from a backup file')
  .option('-t, --tenant <tenantId>', 'Tenant ID')
  .action(async (backupPath, options) => {
    try {
      await MigrationUtils.restoreBackup(backupPath, options.tenant);
      console.log('Backup restored successfully');
    } catch (error) {
      console.error('Error restoring backup:', error);
      process.exit(1);
    }
  });

program
  .command('run')
  .description('Run pending migrations')
  .option('-t, --tenant <tenantId>', 'Tenant ID')
  .option('-d, --dry-run', 'Show what would be migrated without making changes')
  .option('-v, --validate', 'Validate migrations without applying them')
  .option('-b, --backup', 'Create backup before running migrations')
  .action(async (options) => {
    try {
      const migrationsDir = path.join(__dirname, '../migrations');
      const files = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith('.sql'))
        .sort();

      if (options.backup) {
        console.log('Creating backup before running migrations...');
        await MigrationUtils.createBackup(options.tenant);
      }

      for (const file of files) {
        const version = file.split('_')[0];
        const name = file.replace(/^\d+_/, '').replace('.sql', '');
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

        console.log(`Processing migration: ${file}`);

        await MigrationUtils.applyMigration(version, name, sql, {
          tenant: options.tenant,
          dryRun: options.dryRun,
          validateOnly: options.validate,
        });
      }

      console.log('Migrations completed successfully');
    } catch (error) {
      console.error('Error running migrations:', error);
      process.exit(1);
    }
  });

program.parse(process.argv);
