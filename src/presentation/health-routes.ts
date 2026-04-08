/**
 * @module health-routes
 * @description Driving Adapter（駆動するアダプター） — ヘルスチェック用 HTTP ルート。
 */

import type { FastifyInstance } from 'fastify';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database } from '../infrastructure/database.js';

export function registerHealthRoutes(
  app: FastifyInstance,
  db: Kysely<Database>,
): void {
  app.get('/health/live', () => ({ status: 'ok' }));

  app.get('/health/ready', async (request, reply) => {
    try {
      await sql`SELECT 1`.execute(db);
      return { status: 'ok' };
    } catch (error) {
      request.log.error({ err: error }, 'Database unavailable');
      return reply.status(503).send({
        status: 'error',
        message: error instanceof Error ? error.message : 'Database unavailable',
      });
    }
  });
}
