/**
 * @module cli-db-options
 * @description Infrastructure — Commander DB オプション定義の共有ヘルパー。
 *
 * 両エントリーポイント (main / cli) で同じ DB 接続オプションを再利用する。
 * Option.env() により CLI オプション > 環境変数 > デフォルト値 の優先順で解決される。
 */

import type { Command } from 'commander';
import { Option } from 'commander';
import type { DbConfig } from './connection.js';

export interface RawDbOptions {
  readonly dbHost: string;
  readonly dbPort: string;
  readonly dbUser?: string;
  readonly dbPassword?: string;
  readonly dbDatabase?: string;
}

export function addDbOptions(cmd: Command): Command {
  return cmd
    .addOption(new Option('--db-host <host>', 'Database host').env('DATABASE_HOST').default('localhost'))
    .addOption(new Option('--db-port <port>', 'Database port').env('DATABASE_PORT').default('5432'))
    .addOption(new Option('--db-user <user>', 'Database user').env('DATABASE_USER'))
    .addOption(new Option('--db-password <password>', 'Database password').env('DATABASE_PASSWORD'))
    .addOption(new Option('--db-database <name>', 'Database name').env('DATABASE_NAME'));
}

export function extractDbConfig(opts: RawDbOptions): DbConfig {
  return {
    host: opts.dbHost,
    port: Number(opts.dbPort),
    user: opts.dbUser,
    password: opts.dbPassword,
    database: opts.dbDatabase,
  };
}
