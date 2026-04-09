/**
 * @module seed
 * @description Infrastructure — シードデータ投入スクリプト。
 *
 * Kysely の Migrator を流用し、seeds ディレクトリのファイルを管理する。
 * 適用状態は kysely_seed テーブルで追跡され、スキーマ migration とは独立。
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import { FileMigrationProvider, Migrator } from 'kysely';
import { createDb } from './connection.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const db = createDb();

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(currentDir, 'seeds'),
  }),
  migrationTableName: 'kysely_seed',
});

const direction = process.argv[2];

const { error, results } =
  direction === 'down'
    ? await migrator.migrateDown()
    : await migrator.migrateToLatest();

for (const result of results ?? []) {
  if (result.status === 'Success') {
    console.log(
      `Seed "${result.migrationName}" was ${direction === 'down' ? 'reverted' : 'executed'} successfully`,
    );
  } else if (result.status === 'Error') {
    console.error(
      `Failed to ${direction === 'down' ? 'revert' : 'execute'} seed "${result.migrationName}"`,
    );
  }
}

if (error) {
  console.error(`Failed to seed${direction === 'down' ? ' down' : ''}`);
  console.error(error);
  process.exitCode = 1;
}

await db.destroy();
