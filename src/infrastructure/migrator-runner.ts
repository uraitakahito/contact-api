/**
 * @module migrator-runner
 * @description Infrastructure — 汎用マイグレーションランナー。
 *
 * console / process / DB 生成に依存しない副作用フリーの純関数。
 * Kysely インスタンスと設定を外から受け取り、結果を返すだけ。
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { FileMigrationProvider, Migrator } from 'kysely';
import type { Kysely, MigrationInfo, MigrationResultSet } from 'kysely';

export interface RunMigratorConfig {
  /** マイグレーションファイルのディレクトリ (絶対パス) */
  readonly migrationFolder: string;
  /** Kysely の管理テーブル名 */
  readonly tableName: string;
  /** Kysely のロックテーブル名 */
  readonly lockTableName: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely の Migrator が Kysely<any> を要求するため
function createMigrator(db: Kysely<any>, config: RunMigratorConfig): Migrator {
  return new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: config.migrationFolder,
    }),
    migrationTableName: config.tableName,
    migrationLockTableName: config.lockTableName,
  });
}

export async function runMigrator(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely の Migrator が Kysely<any> を要求するため
  db: Kysely<any>,
  config: RunMigratorConfig,
  direction: 'up' | 'down',
): Promise<MigrationResultSet> {
  const migrator = createMigrator(db, config);
  return direction === 'down'
    ? migrator.migrateDown()
    : migrator.migrateToLatest();
}

export async function getMigrationInfos(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely の Migrator が Kysely<any> を要求するため
  db: Kysely<any>,
  config: RunMigratorConfig,
): Promise<readonly MigrationInfo[]> {
  const migrator = createMigrator(db, config);
  return migrator.getMigrations();
}
