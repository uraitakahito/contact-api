/**
 * @module migrate
 * @description マイグレーション CLI エントリーポイント。
 *
 * Commander.js で DB 接続オプションとマイグレーション方向を受け取り、
 * Kysely マイグレーションを実行する。
 */

import { Argument, Command } from 'commander';
import type { RawDbOptions } from '../infrastructure/cli-db-options.js';
import { addDbOptions, extractDbConfig } from '../infrastructure/cli-db-options.js';
import { addLogLevelOption } from '../infrastructure/cli-log-level-option.js';
import type { RawLogLevelOption } from '../infrastructure/cli-log-level-option.js';
import type { RawMigrationFolderOption } from '../infrastructure/cli-migration-folder-option.js';
import { addMigrationFolderOption } from '../infrastructure/cli-migration-folder-option.js';
import { createKyselyClient } from '../infrastructure/connection.js';
import { logger, createChildLogger } from '../infrastructure/logger.js';
import { getMigrationInfos, runMigrator } from '../infrastructure/migrator-runner.js';

const label = 'Migration';

// CLI
const program = new Command();

program
  .name('migrate')
  .description('Run database migrations')
  .addArgument(new Argument('<direction>', 'Migration direction').choices(['up', 'down']));

addDbOptions(program);
addMigrationFolderOption(program);
addLogLevelOption(program);
program.parse();

const direction = program.args[0] as 'up' | 'down';
const opts = program.opts<RawDbOptions & RawLogLevelOption & RawMigrationFolderOption>();
logger.level = opts.logLevel;

const cliLogger = createChildLogger({ command: 'migrate', direction });

// Infrastructure
const kyselyClient = createKyselyClient(extractDbConfig(opts));
const migratorConfig = {
  migrationFolder: opts.migrationFolder,
  tableName: 'kysely_migration',
  lockTableName: 'kysely_migration_lock',
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
