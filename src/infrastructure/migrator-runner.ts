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
import type { Kysely, MigrationResultSet } from 'kysely';

export interface RunMigratorConfig {
  /** マイグレーションファイルのディレクトリ (絶対パス) */
  readonly migrationFolder: string;
  /** Kysely の管理テーブル名 (省略時: デフォルト kysely_migration) */
  readonly tableName?: string | undefined;
}

export async function runMigrator(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely の Migrator が Kysely<any> を要求するため
  db: Kysely<any>,
  config: RunMigratorConfig,
  direction: 'down' | 'latest',
): Promise<MigrationResultSet> {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: config.migrationFolder,
    }),
    ...(config.tableName !== undefined ? { migrationTableName: config.tableName } : {}),
  });

  return direction === 'down'
    ? migrator.migrateDown()
    : migrator.migrateToLatest();
}
