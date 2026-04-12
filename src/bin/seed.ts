/**
 * @module seed
 * @description シード CLI エントリーポイント。
 *
 * DB 接続オプションとシード方向を受け取り、
 * Kysely マイグレーションランナーでシードデータを投入/削除する。
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

const label = 'Seed';

// CLI
const program = new Command();

program
  .name('seed')
  .description('Run database seeds')
  .addArgument(new Argument('<direction>', 'Seed direction').choices(['up', 'down']))
  .addOption(
    new Option('--seed-folder <path>', 'Path to seed files directory')
      .env('SEED_FOLDER')
      .default(new URL('../infrastructure/seeds/', import.meta.url))
      .argParser(parsePath),
  );

addContactApiDbOptions(program);
addLogLevelOption(program);
program.parse();

const direction = program.args[0] as 'up' | 'down';
const opts = program.opts<RawContactApiDbOptions & RawLogLevelOption & { readonly seedFolder: URL }>();
const cliLogger = initializeCliLogger(opts.logLevel, { command: 'seed', direction });

// Infrastructure
const kyselyClient = createKyselyClient(toContactApiDbConfig(opts));
const migratorConfig = {
  migrationFolder: opts.seedFolder,
  migrationTableName: 'kysely_seed',
  migrationLockTableName: 'kysely_seed_lock',
};

await runMigratorCli({
  label,
  direction,
  migratorConfig,
  kyselyClient,
  cliLogger,
});
