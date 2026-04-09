/**
 * @module cli
 * @description Infrastructure — マイグレーション / シード CLI エントリーポイント。
 *
 * argv 解析、DB ライフサイクル、ログ出力、exitCode 設定を担う薄いグルーコード。
 */

import { createDb } from './connection.js';
import { migratorDefinitions } from './migrator-definitions.js';
import { runMigrator } from './migrator-runner.js';

const command = process.argv[2];
const definition = command !== undefined ? migratorDefinitions[command] : undefined;

if (!definition) {
  console.error(`Unknown command: ${command ?? '(none)'}`);
  console.error(`Available: ${Object.keys(migratorDefinitions).join(', ')}`);
  process.exitCode = 1;
} else {
  const direction = process.argv[3] === 'down' ? 'down' : 'latest';
  const db = createDb();

  const { error, results } = await runMigrator(
    db,
    {
      migrationFolder: definition.folder,
      tableName: definition.tableName,
    },
    direction,
  );

  for (const result of results ?? []) {
    if (result.status === 'Success') {
      console.log(
        `${definition.label} "${result.migrationName}" was ${direction === 'down' ? 'reverted' : 'executed'} successfully`,
      );
    } else if (result.status === 'Error') {
      console.error(
        `Failed to ${direction === 'down' ? 'revert' : 'execute'} ${definition.label.toLowerCase()} "${result.migrationName}"`,
      );
    }
  }

  if (error) {
    console.error(
      `Failed to ${definition.label.toLowerCase()}${direction === 'down' ? ' down' : ''}`,
    );
    console.error(error);
    process.exitCode = 1;
  }

  await db.destroy();
}
