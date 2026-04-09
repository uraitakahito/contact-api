/**
 * @module cli-log-level-option
 * @description Infrastructure — Commander log-level オプション定義の共有ヘルパー。
 *
 * 両エントリーポイント (server / cli) で同じ log-level オプションを再利用する。
 */

import type { Command } from 'commander';
import { Option } from 'commander';

const logLevels = ['silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;

type LogLevel = (typeof logLevels)[number];

export interface RawLogLevelOption {
  readonly logLevel: LogLevel;
}

export function addLogLevelOption(cmd: Command): Command {
  return cmd.addOption(
    new Option('--log-level <level>', 'Log output level')
      .choices([...logLevels])
      .env('LOG_LEVEL')
      .default('info' as const),
  );
}
