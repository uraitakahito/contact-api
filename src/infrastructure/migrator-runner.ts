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

export async function getMigrationInfos(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely の Migrator が Kysely<any> を要求するため
  kyselyClient: Kysely<any>,
  config: RunMigratorConfig,
): Promise<readonly MigrationInfo[]> {
  const migrator = createMigrator(kyselyClient, config);
  return migrator.getMigrations();
}
