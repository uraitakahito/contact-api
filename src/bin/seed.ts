/**
 * @module seed
 * @description シード CLI エントリーポイント。
 *
 * DB 接続オプションとシード方向を受け取り、
 * Kysely マイグレーションランナーでシードデータを投入/削除する。
 */

import { Argument, Command, Option } from 'commander';
import type { RawContactApiDbOptions } from '../infrastructure/cli-contact-api-db-options.js';
import { addContactApiDbOptions, extractContactApiDbConfig } from '../infrastructure/cli-contact-api-db-options.js';
import { addLogLevelOption } from '../infrastructure/cli-log-level-option.js';
import type { RawLogLevelOption } from '../infrastructure/cli-log-level-option.js';
import { parsePath } from '../infrastructure/cli-parsers.js';
import { createKyselyClient } from '../infrastructure/connection.js';
import { logger, initializeCliLogger } from '../infrastructure/logger.js';
import { getMigrationInfos, runMigrator } from '../infrastructure/migrator-runner.js';

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
const kyselyClient = createKyselyClient(extractContactApiDbConfig(opts));
const migratorConfig = {
  migrationFolder: opts.seedFolder,
  tableName: 'kysely_seed',
  lockTableName: 'kysely_seed_lock',
};

const { error, results } = await runMigrator(kyselyClient, migratorConfig, direction);

for (const result of results ?? []) {
  if (result.status === 'Success') {
    cliLogger.info(
      { migration: result.migrationName },
      `${label} "${result.migrationName}" was ${direction === 'down' ? 'reverted' : 'executed'} successfully`,
    );
  } else if (result.status === 'Error') {
    cliLogger.error(
      { migration: result.migrationName },
      `Failed to ${direction === 'down' ? 'revert' : 'execute'} ${label.toLowerCase()} "${result.migrationName}"`,
    );
  }
}

if (results?.length === 0) {
  cliLogger.info(`No pending ${label.toLowerCase()} to execute`);

  if (logger.isLevelEnabled('debug')) {
    const infos = await getMigrationInfos(kyselyClient, migratorConfig);
    if (infos.length > 0) {
      cliLogger.info(`${label} status:`);
      for (const info of infos) {
        if (info.executedAt) {
          cliLogger.info(
            { name: info.name, executedAt: info.executedAt.toISOString() },
            `${info.name} applied`,
          );
        } else {
          cliLogger.info({ name: info.name }, `${info.name} not applied`);
        }
      }
    }
  }
}

if (error) {
  cliLogger.error(
    { err: error },
    `Failed to ${label.toLowerCase()}${direction === 'down' ? ' down' : ''}`,
  );
  process.exitCode = 1;
}

await kyselyClient.destroy();
