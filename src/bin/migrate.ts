/**
 * @module migrate
 * @description マイグレーション CLI エントリーポイント。
 *
 * DB 接続オプションとマイグレーション方向を受け取り、Kysely マイグレーションを実行する。
 */

import { Argument, Command, Option } from 'commander';
import type { RawContactApiDbOptions } from '../infrastructure/cli-contact-api-db-options.js';
import { addContactApiDbOptions, toContactApiDbConfig } from '../infrastructure/cli-contact-api-db-options.js';
import { addLogLevelOption } from '../infrastructure/cli-log-level-option.js';
import type { RawLogLevelOption } from '../infrastructure/cli-log-level-option.js';
import { parsePath } from '../infrastructure/cli-parsers.js';
import { createKyselyClient } from '../infrastructure/connection.js';
import { initializeCliLogger } from '../infrastructure/logger.js';
import { runMigratorCli } from '../infrastructure/migrator-runner.js';

const label = 'Migration';

// CLI
const program = new Command();

program
  .name('migrate')
  .description('Run database migrations')
  .addArgument(new Argument('<direction>', 'Migration direction').choices(['up', 'down']))
  .addOption(
    new Option('--migration-folder <path>', 'Path to migration files directory')
      .env('MIGRATION_FOLDER')
      .default(new URL('../infrastructure/migrations/', import.meta.url))
      .argParser(parsePath),
  );

addContactApiDbOptions(program);
addLogLevelOption(program);
program.parse();

const direction = program.args[0] as 'up' | 'down';
const opts = program.opts<RawContactApiDbOptions & RawLogLevelOption & { readonly migrationFolder: URL }>();
const cliLogger = initializeCliLogger(opts.logLevel, { command: 'migrate', direction });

// Infrastructure
const kyselyClient = createKyselyClient(toContactApiDbConfig(opts));
const migratorConfig = {
  migrationFolder: opts.migrationFolder,
  migrationTableName: 'kysely_migration',
  migrationLockTableName: 'kysely_migration_lock',
};

await runMigratorCli({
  label,
  direction,
  migratorConfig,
  kyselyClient,
  cliLogger,
});
