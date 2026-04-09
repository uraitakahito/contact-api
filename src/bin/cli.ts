/**
 * @module cli
 * @description マイグレーション / シード CLI エントリーポイント。
 *
 * Commander.js でサブコマンド (migrate / seed) と DB 接続オプションを提供する。
 */

import { Command } from 'commander';
import { Argument } from 'commander';
import type { RawDbOptions } from '../infrastructure/cli-db-options.js';
import { addDbOptions, extractDbConfig } from '../infrastructure/cli-db-options.js';
import type { RawLogLevelOption } from '../infrastructure/cli-log-level-option.js';
import { addLogLevelOption } from '../infrastructure/cli-log-level-option.js';
import { createDb } from '../infrastructure/connection.js';
import { logger, createChildLogger } from '../infrastructure/logger.js';
import { migratorDefinitions } from '../infrastructure/migrator-definitions.js';
import type { MigratorDefinition } from '../infrastructure/migrator-definitions.js';
import { getMigrationInfos, runMigrator } from '../infrastructure/migrator-runner.js';

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
    .addArgument(new Argument('<direction>', 'Migration direction').choices(['up', 'down']));

  addDbOptions(cmd);
  addLogLevelOption(cmd);

  cmd.action(async (direction: 'up' | 'down', opts: RawDbOptions & RawLogLevelOption) => {
    logger.level = opts.logLevel;
    const cliLogger = createChildLogger({ command: name, direction });

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
        cliLogger.info(
          { migration: result.migrationName },
          `${definition.label} "${result.migrationName}" was ${direction === 'down' ? 'reverted' : 'executed'} successfully`,
        );
      } else if (result.status === 'Error') {
        cliLogger.error(
          { migration: result.migrationName },
          `Failed to ${direction === 'down' ? 'revert' : 'execute'} ${definition.label.toLowerCase()} "${result.migrationName}"`,
        );
      }
    }

    if (results?.length === 0) {
      cliLogger.info(`No pending ${definition.label.toLowerCase()} to execute`);

      if (logger.isLevelEnabled('debug')) {
        const migratorConfig = {
          migrationFolder: definition.folder,
          tableName: definition.tableName,
          lockTableName: definition.lockTableName,
        };
        const infos = await getMigrationInfos(db, migratorConfig);
        if (infos.length > 0) {
          cliLogger.info(`${definition.label} status:`);
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
        `Failed to ${definition.label.toLowerCase()}${direction === 'down' ? ' down' : ''}`,
      );
      process.exitCode = 1;
    }

    await db.destroy();
  });
}

for (const [name, definition] of Object.entries(migratorDefinitions)) {
  registerMigratorCommand(program, name, definition);
}

await program.parseAsync();
