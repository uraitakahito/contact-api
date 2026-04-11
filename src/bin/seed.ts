/**
 * @module seed
 * @description シード CLI エントリーポイント。
 *
 * DB 接続オプションとシード方向を受け取り、
 * Kysely マイグレーションランナーでシードデータを投入/削除する。
 */

import { Argument, Command } from 'commander';
import type { RawDbOptions } from '../infrastructure/cli-db-options.js';
import { addDbOptions, extractDbConfig } from '../infrastructure/cli-db-options.js';
import { addLogLevelOption } from '../infrastructure/cli-log-level-option.js';
import type { RawLogLevelOption } from '../infrastructure/cli-log-level-option.js';
import type { RawSeedFolderOption } from '../infrastructure/cli-seed-folder-option.js';
import { addSeedFolderOption } from '../infrastructure/cli-seed-folder-option.js';
import { createKyselyClient } from '../infrastructure/connection.js';
import { logger, createChildLogger } from '../infrastructure/logger.js';
import { getMigrationInfos, runMigrator } from '../infrastructure/migrator-runner.js';

const label = 'Seed';

// CLI
const program = new Command();

program
  .name('seed')
  .description('Run database seeds')
  .addArgument(new Argument('<direction>', 'Seed direction').choices(['up', 'down']));

addDbOptions(program);
addSeedFolderOption(program);
addLogLevelOption(program);
program.parse();

const direction = program.args[0] as 'up' | 'down';
const opts = program.opts<RawDbOptions & RawLogLevelOption & RawSeedFolderOption>();
logger.level = opts.logLevel;

const cliLogger = createChildLogger({ command: 'seed', direction });

// Infrastructure
const kyselyClient = createKyselyClient(extractDbConfig(opts));
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
