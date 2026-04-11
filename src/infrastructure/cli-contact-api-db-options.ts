/**
 * @module cli-contact-api-db-options
 * @description Infrastructure — Commander DB オプション定義の共有ヘルパー。
 *
 * Option.env() により CLI オプション > 環境変数 > デフォルト値 の優先順で解決される。
 */

import type { Command } from 'commander';
import { Option } from 'commander';
import { parsePort } from './cli-parsers.js';
import type { DbConfig } from './connection.js';

export interface RawContactApiDbOptions {
  readonly dbHost: string;
  readonly dbPort: number;
  readonly dbUser?: string;
  readonly dbPassword?: string;
  readonly dbDatabase?: string;
  readonly dbPoolSize: number;
}

export function addContactApiDbOptions(cmd: Command): Command {
  return cmd
    .addOption(new Option('--db-host <host>', 'Database host').env('CONTACT_API_DB_HOST').default('localhost'))
    .addOption(new Option('--db-port <port>', 'Database port').env('CONTACT_API_DB_PORT').default(5432).argParser(parsePort))
    .addOption(new Option('--db-user <user>', 'Database user').env('CONTACT_API_DB_USER'))
    .addOption(new Option('--db-password <password>', 'Database password').env('CONTACT_API_DB_PASSWORD'))
    .addOption(new Option('--db-database <name>', 'Database name').env('CONTACT_API_DB_NAME'))
    .addOption(new Option('--db-pool-size <size>', 'Database connection pool size').env('CONTACT_API_DB_POOL_SIZE').default(10).argParser(parsePort));
}

export function extractContactApiDbConfig(opts: RawContactApiDbOptions): DbConfig {
  return {
    host: opts.dbHost,
    port: opts.dbPort,
    user: opts.dbUser,
    password: opts.dbPassword,
    database: opts.dbDatabase,
    max: opts.dbPoolSize,
  };
}
