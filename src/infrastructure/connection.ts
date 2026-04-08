/**
 * @module connection
 * @description Kysely データベース接続ファクトリ。
 *
 * Driven Adapter が使用するDB接続を生成する。
 */

import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { Database } from './database.js';

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  max?: number;
}

export function createDb(config?: Partial<DbConfig>): Kysely<Database> {
  const dialect = new PostgresDialect({
    pool: new pg.Pool({
      host: config?.host ?? process.env['DATABASE_HOST'] ?? 'localhost',
      port: config?.port ?? Number(process.env['DATABASE_PORT'] ?? 5432),
      user: config?.user ?? process.env['DATABASE_USER'],
      password: config?.password ?? process.env['DATABASE_PASSWORD'],
      database: config?.database ?? process.env['DATABASE_NAME'],
      max: config?.max ?? 10,
    }),
  });

  return new Kysely<Database>({
    dialect,
    plugins: [new CamelCasePlugin()],
  });
}
