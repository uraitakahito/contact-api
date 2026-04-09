/**
 * @module cli-db-options
 * @description Infrastructure — Commander DB オプション定義の共有ヘルパー。
 *
 * 両エントリーポイント (main / cli) で同じ DB 接続オプションを再利用する。
 */

import type { Command } from 'commander';
import { Option } from 'commander';
import type { DbConfig } from './connection.js';

export interface RawDbOptions {
  readonly dbHost?: string | undefined;
  readonly dbPort?: string | undefined;
  readonly dbUser?: string | undefined;
  readonly dbPassword?: string | undefined;
  readonly dbDatabase?: string | undefined;
}

export function addDbOptions(cmd: Command): Command {
  return cmd
    .addOption(new Option('--db-host <host>', 'Database host'))
    .addOption(new Option('--db-port <port>', 'Database port'))
    .addOption(new Option('--db-user <user>', 'Database user'))
    .addOption(new Option('--db-password <password>', 'Database password'))
    .addOption(new Option('--db-database <name>', 'Database name'));
}

export function extractDbConfig(opts: RawDbOptions): Partial<DbConfig> {
  const config: Partial<DbConfig> = {};
  if (opts.dbHost !== undefined) config.host = opts.dbHost;
  if (opts.dbPort !== undefined) config.port = Number(opts.dbPort);
  if (opts.dbUser !== undefined) config.user = opts.dbUser;
  if (opts.dbPassword !== undefined) config.password = opts.dbPassword;
  if (opts.dbDatabase !== undefined) config.database = opts.dbDatabase;
  return config;
}
