/**
 * @module cli-migration-folder-option
 * @description Infrastructure — Commander migration-folder オプション定義の共有ヘルパー。
 */

import type { Command } from 'commander';
import { Option } from 'commander';
import { parsePath } from './cli-parsers.js';

export interface RawMigrationFolderOption {
  readonly migrationFolder: URL;
}

const defaultPath = new URL('./migrations/', import.meta.url);

export function addMigrationFolderOption(cmd: Command): Command {
  return cmd.addOption(
    new Option('--migration-folder <path>', 'Path to migration files directory')
      .env('MIGRATION_FOLDER')
      .default(defaultPath)
      .argParser(parsePath),
  );
}
