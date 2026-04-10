/**
 * @module cli-migration-folder-option
 * @description Infrastructure — Commander migration-folder オプション定義の共有ヘルパー。
 *
 * migrate / seed 両エントリーポイントで同じ --migration-folder オプションを再利用する。
 * デフォルト値と環境変数名はエントリーポイントごとに異なるため、パラメータ化している。
 */

import type { Command } from 'commander';
import { Option } from 'commander';
import { parsePath } from './cli-parsers.js';

export interface RawMigrationFolderOption {
  readonly migrationFolder: string;
}

export function addMigrationFolderOption(
  cmd: Command,
  options: { readonly defaultPath: string; readonly envVar: string },
): Command {
  return cmd.addOption(
    new Option('--migration-folder <path>', 'Path to migration files directory')
      .env(options.envVar)
      .default(options.defaultPath)
      .argParser(parsePath),
  );
}
