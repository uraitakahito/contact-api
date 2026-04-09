/**
 * @module cli
 * @description Infrastructure — マイグレーション / シード CLI エントリーポイント。
 *
 * Commander.js でサブコマンド (migrate / seed) と DB 接続オプションを提供する。
 */

import { Command } from 'commander';
import type { RawDbOptions } from './cli-db-options.js';
import { addDbOptions, extractDbConfig } from './cli-db-options.js';
import { createDb } from './connection.js';
import { migratorDefinitions } from './migrator-definitions.js';
import type { MigratorDefinition } from './migrator-definitions.js';
import { runMigrator } from './migrator-runner.js';

const program = new Command();
program.name('contact-cli').description('Contact API database CLI');

function registerMigratorCommand(
  parent: Command,
  name: string,
  definition: MigratorDefinition,
): void {
  const cmd = parent
    .command(name)
    .description(`Run ${definition.label.toLowerCase()}`)
    .option('--down', `Revert the last ${definition.label.toLowerCase()}`);

  addDbOptions(cmd);

  cmd.action(async (opts: { down?: true } & RawDbOptions) => {
    const direction = opts.down === true ? 'down' : 'latest';
    const db = createDb(extractDbConfig(opts));

    const { error, results } = await runMigrator(
      db,
      {
        migrationFolder: definition.folder,
        tableName: definition.tableName,
        lockTableName: definition.lockTableName,
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
  });
}

for (const [name, definition] of Object.entries(migratorDefinitions)) {
  registerMigratorCommand(program, name, definition);
}

await program.parseAsync();
