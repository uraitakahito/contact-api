/**
 * @module cli-seed-folder-option
 * @description Infrastructure — Commander seed-folder オプション定義の共有ヘルパー。
 */

import type { Command } from 'commander';
import { Option } from 'commander';
import { parsePath } from './cli-parsers.js';

export interface RawSeedFolderOption {
  readonly seedFolder: URL;
}

const defaultPath = new URL('./seeds/', import.meta.url);

export function addSeedFolderOption(cmd: Command): Command {
  return cmd.addOption(
    new Option('--seed-folder <path>', 'Path to seed files directory')
      .env('SEED_FOLDER')
      .default(defaultPath)
      .argParser(parsePath),
  );
}
