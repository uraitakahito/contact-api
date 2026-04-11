/**
 * @module cli-migration-folder-option
 * @description Infrastructure — Commander migration-folder オプション定義の共有ヘルパー。
 */

import { fileURLToPath } from 'node:url';
import type { Command } from 'commander';
import { Option } from 'commander';
import { parsePath } from './cli-parsers.js';

export interface RawMigrationFolderOption {
  readonly migrationFolder: string;
}

const defaultPath = fileURLToPath(new URL('./migrations', import.meta.url));

export function addMigrationFolderOption(cmd: Command): Command {
  return cmd.addOption(
    new Option('--migration-folder <path>', 'Path to migration files directory')
      .env('MIGRATION_FOLDER')
      .default(defaultPath)
      .argParser(parsePath),
  );
}
