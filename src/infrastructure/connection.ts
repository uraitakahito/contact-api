/**
 * @module connection
 * @description Kysely データベース接続ファクトリ。
 *
 * Driven Adapter が使用するDB接続を生成する。
 */

import type { LogEvent } from 'kysely';
import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { Database } from './database.js';
import { createChildLogger } from './logger.js';

const kyselyLogger = createChildLogger({ module: 'kysely' });

function createKyselyLog(): (event: LogEvent) => void {
  return (event: LogEvent): void => {
    if (event.level === 'error') {
      kyselyLogger.error(
        { sql: event.query.sql, durationMs: event.queryDurationMillis, err: event.error },
        'Query error',
      );
    } else if (kyselyLogger.isLevelEnabled('debug')) {
      kyselyLogger.debug(
        { sql: event.query.sql, durationMs: event.queryDurationMillis },
        'Query executed',
      );
    }
  };
}

export interface DbConfig {
  host: string;
  port: number;
  user?: string | undefined;
  password?: string | undefined;
  database?: string | undefined;
  max: number;
}

export function createKyselyClient(config: DbConfig): Kysely<Database> {
  const dialect = new PostgresDialect({
    pool: new pg.Pool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      max: config.max,
    }),
  });

  return new Kysely<Database>({
    dialect,
    plugins: [new CamelCasePlugin()],
    log: createKyselyLog(),
  });
}
