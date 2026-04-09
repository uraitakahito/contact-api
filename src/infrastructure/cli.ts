/**
 * @module cli
 * @description Infrastructure — マイグレーション / シード CLI エントリーポイント。
 *
 * Commander.js でサブコマンド (migrate / seed) と DB 接続オプションを提供する。
 */

import { Command } from 'commander';
import type { RawDbOptions } from './cli-db-options.js';
import { addDbOptions, extractDbConfig } from './cli-db-options.js';
import type { RawVerboseOption } from './cli-verbose-option.js';
import { addVerboseOption } from './cli-verbose-option.js';
import { createDb } from './connection.js';
import { migratorDefinitions } from './migrator-definitions.js';
import type { MigratorDefinition } from './migrator-definitions.js';
import { getMigrationInfos, runMigrator } from './migrator-runner.js';

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
  addVerboseOption(cmd);

  cmd.action(async (opts: { down?: true } & RawDbOptions & RawVerboseOption) => {
    const direction = opts.down === true ? 'down' : 'latest';
    const db = createDb({ ...extractDbConfig(opts), verbose: opts.verbose === true });

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

    if (results?.length === 0) {
      console.log(`No pending ${definition.label.toLowerCase()} to execute`);

      if (opts.verbose === true) {
        const migratorConfig = {
          migrationFolder: definition.folder,
          tableName: definition.tableName,
          lockTableName: definition.lockTableName,
        };
        const infos = await getMigrationInfos(db, migratorConfig);
        if (infos.length > 0) {
          console.log(`\n${definition.label} status:`);
          for (const info of infos) {
            if (info.executedAt) {
              console.log(`  ✓ ${info.name} (applied at ${info.executedAt.toISOString()})`);
            } else {
              console.log(`  - ${info.name} (not applied)`);
            }
          }
        }
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
