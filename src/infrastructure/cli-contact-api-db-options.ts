/**
 * @module cli-contact-api-db-options
 * @description Infrastructure — Commander DB オプション定義の共有ヘルパー。
 *
 * Option.env() により CLI オプション > 環境変数 > デフォルト値 の優先順で解決される。
 */

import type { Command } from 'commander';
import { Option } from 'commander';
import { parsePort } from './cli-parsers.js';
import type { ContactApiDbConfig } from './connection.js';

/**
 * Commander の CLI オプション型。
 *
 * ContactApiDbConfig（インフラ層の正規型）から Mapped Type で自動導出する。
 * こうすることで型定義の重複を排除しつつ、依存方向を
 *   cli-contact-api-db-options → connection（ContactApiDbConfig）
 * に保つ。逆方向（connection が CLI 型に依存）にすると、
 * CLI 固有の `db` プレフィックス命名がインフラ層やテスト層に漏洩するため避ける。
 *
 * `db` プレフィックスは Commander が全オプションをフラットな名前空間に
 * 格納する都合上、他オプション（--server-port, --openfga-* 等）との
 * 衝突を防ぐために付与している。
 */
export type RawContactApiDbOptions = Readonly<{
  [K in keyof ContactApiDbConfig as `db${Capitalize<K>}`]: ContactApiDbConfig[K];
}>;

export function addContactApiDbOptions(cmd: Command): Command {
  return cmd
    .addOption(new Option('--db-host <host>', 'Database host').env('CONTACT_API_DB_HOST').default('localhost'))
    .addOption(new Option('--db-port <port>', 'Database port').env('CONTACT_API_DB_PORT').default(5432).argParser(parsePort))
    .addOption(new Option('--db-user <user>', 'Database user').env('CONTACT_API_DB_USER'))
    .addOption(new Option('--db-password <password>', 'Database password').env('CONTACT_API_DB_PASSWORD'))
    .addOption(new Option('--db-database <name>', 'Database name').env('CONTACT_API_DB_NAME'))
    .addOption(new Option('--db-pool-size <size>', 'Database connection pool size').env('CONTACT_API_DB_POOL_SIZE').default(10).argParser(parsePort));
}

export function extractContactApiDbConfig(opts: RawContactApiDbOptions): ContactApiDbConfig {
  return {
    host: opts.dbHost,
    port: opts.dbPort,
    user: opts.dbUser,
    password: opts.dbPassword,
    database: opts.dbDatabase,
    poolSize: opts.dbPoolSize,
  };
}
