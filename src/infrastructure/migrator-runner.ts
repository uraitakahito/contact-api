/**
 * @module migrator-runner
 * @description Infrastructure — 汎用マイグレーションランナー。
 *
 * console / process / DB 生成に依存しない副作用フリーの純関数。
 * Kysely インスタンスと設定を外から受け取り、結果を返すだけ。
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileMigrationProvider, Migrator } from 'kysely';
import type { Kysely, MigrationInfo, MigrationResultSet } from 'kysely';
import type { Logger } from './logger.js';

export interface RunMigratorConfig {
  readonly migrationFolder: URL;
  readonly migrationTableName: string;
  readonly migrationLockTableName: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely の Migrator が Kysely<any> を要求するため
function createMigrator(kyselyClient: Kysely<any>, config: RunMigratorConfig): Migrator {
  return new Migrator({
    db: kyselyClient,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: fileURLToPath(config.migrationFolder),
    }),
    migrationTableName: config.migrationTableName,
    migrationLockTableName: config.migrationLockTableName,
  });
}

export async function runMigrator(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely の Migrator が Kysely<any> を要求するため
  kyselyClient: Kysely<any>,
  config: RunMigratorConfig,
  direction: 'up' | 'down',
): Promise<MigrationResultSet> {
  const migrator = createMigrator(kyselyClient, config);
  return direction === 'down'
    ? migrator.migrateDown()
    : migrator.migrateToLatest();
}

export interface RunMigratorCliConfig {
  readonly label: string;
  readonly direction: 'up' | 'down';
  readonly migratorConfig: RunMigratorConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely の Migrator が Kysely<any> を要求するため
  readonly kyselyClient: Kysely<any>;
  readonly cliLogger: Logger;
}

export async function runMigratorCli(config: RunMigratorCliConfig): Promise<void> {
  const { label, direction, migratorConfig, kyselyClient, cliLogger } = config;
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

    if (cliLogger.isLevelEnabled('debug')) {
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
}

export async function getMigrationInfos(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely の Migrator が Kysely<any> を要求するため
  kyselyClient: Kysely<any>,
  config: RunMigratorConfig,
): Promise<readonly MigrationInfo[]> {
  const migrator = createMigrator(kyselyClient, config);
  return migrator.getMigrations();
}
