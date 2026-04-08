import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Kysely } from 'kysely';
import type { Database } from '../infrastructure/database.js';
import { createTestApp } from '../test-helpers/setup.js';

let app: FastifyInstance;
let db: Kysely<Database>;

beforeAll(async () => {
  const testApp = await createTestApp();
  app = testApp.app;
  db = testApp.db;
});

afterAll(async () => {
  await app.close();
  await db.destroy();
});

describe('GET /health/live', () => {
  it('should return 200', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/live' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});

describe('GET /health/ready', () => {
  it('should return 200 when DB is available', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('should return 503 when DB is unavailable', async () => {
    await db.destroy();

    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ status: 'error' });
  });
});

describe('GET /health (removed)', () => {
  it('should return 404', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(404);
  });
});
