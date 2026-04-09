/**
 * @module cli-verbose-option
 * @description Infrastructure — Commander verbose オプション定義の共有ヘルパー。
 *
 * 両エントリーポイント (main / cli) で同じ verbose オプションを再利用する。
 */

import type { Command } from 'commander';

export interface RawVerboseOption {
  readonly verbose?: true | undefined;
}

export function addVerboseOption(cmd: Command): Command {
  return cmd.option('--verbose', 'Enable verbose output');
}
