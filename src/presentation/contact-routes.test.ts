import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Kysely } from 'kysely';
import type { Database } from '../infrastructure/database.js';
import type { InMemoryContactAuthorizationService } from '../test-helpers/in-memory-contact-authorization-service.js';
import type { SuccessEnvelope } from './envelope.js';
import type { ContactResponse } from './format.js';
import { cleanDatabase, createTestApp } from '../test-helpers/setup.js';

let app: FastifyInstance;
let db: Kysely<Database>;
let authz: InMemoryContactAuthorizationService;

const headers = { 'x-user-id': 'test-user' };

beforeAll(async () => {
  const testApp = await createTestApp();
  app = testApp.app;
  db = testApp.db;
  authz = testApp.authz;
});

afterEach(async () => {
  await cleanDatabase(db, authz);
});

afterAll(async () => {
  await app.close();
  await db.destroy();
});

const samplePayload = {
  templateId: 1,
  data: {
    lastName: 'Test',
    firstName: 'User',
    email: 'test@example.com',
    category: 'general',
    message: 'Test message body',
  },
};

/** レスポンスからエンベロープの data を取得するヘルパー */
function successData(response: { json: () => unknown }): unknown {
  return (response.json() as SuccessEnvelope<unknown>).data;
}

describe('Authentication (X-User-Id)', () => {
  it('should return 401 when X-User-Id header is missing', async () => {
    const response = await app.inject({ method: 'GET', url: '/contacts' });
    expect(response.statusCode).toBe(401);
    expect((response.json() as { success: number }).success).toBe(0);
  });

  it('should return 401 when X-User-Id header is empty', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/contacts',
      headers: { 'x-user-id': '' },
    });
    expect(response.statusCode).toBe(401);
    expect((response.json() as { success: number }).success).toBe(0);
  });
});

describe('POST /contacts', () => {
  it('should create a contact', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: samplePayload,
    });

    expect(response.statusCode).toBe(201);
    const envelope = response.json() as SuccessEnvelope<ContactResponse>;
    expect(envelope.success).toBe(1);
    const body = envelope.data;
    expect(body.templateId).toBe(1);
    expect(body.userId).toBe('test-user');
    expect(body.data).toEqual(samplePayload.data);
    expect(body.status).toBe('new');
    expect(body.id).toBeDefined();
    expect(body.createdAt).toBeDefined();
    expect(body.updatedAt).toBeDefined();
  });

  it('should return 400 for missing required field in data', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: { templateId: 1, data: { last_name: 'Test' } },
    });

    expect(response.statusCode).toBe(400);
    expect((response.json() as { success: number }).success).toBe(0);
  });

  it('should return 400 for invalid email in data', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: {
        templateId: 1,
        data: { ...samplePayload.data, email: 'not-an-email' },
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for non-existent templateId', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: { templateId: 999, data: {} },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for invalid select option', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: {
        templateId: 1,
        data: { ...samplePayload.data, category: 'invalid-option' },
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('GET /contacts', () => {
  it('should return only contacts the user owns', async () => {
    await app.inject({ method: 'POST', url: '/contacts', headers, payload: samplePayload });
    await app.inject({ method: 'POST', url: '/contacts', headers, payload: samplePayload });

    const response = await app.inject({ method: 'GET', url: '/contacts', headers });

    expect(response.statusCode).toBe(200);
    const body = successData(response) as ContactResponse[];
    expect(body).toHaveLength(2);
  });

  it('should return empty array for user with no access', async () => {
    await app.inject({ method: 'POST', url: '/contacts', headers, payload: samplePayload });

    const response = await app.inject({
      method: 'GET',
      url: '/contacts',
      headers: { 'x-user-id': 'other-user' },
    });

    expect(response.statusCode).toBe(200);
    const body = successData(response) as ContactResponse[];
    expect(body).toHaveLength(0);
  });

  it('should filter by status', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: samplePayload,
    });
    const { id: contactId } = successData(createRes) as ContactResponse;

    await app.inject({
      method: 'PATCH',
      url: `/contacts/${contactId}/status`,
      headers,
      payload: { status: 'in_progress' },
    });

    await app.inject({ method: 'POST', url: '/contacts', headers, payload: samplePayload });

    const inProgressRes = await app.inject({
      method: 'GET',
      url: '/contacts?status=in_progress',
      headers,
    });
    expect(successData(inProgressRes) as ContactResponse[]).toHaveLength(1);
  });

  it('should filter by templateId', async () => {
    await app.inject({ method: 'POST', url: '/contacts', headers, payload: samplePayload });
    await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: { templateId: 2, data: { name: 'Taro', email: 'taro@example.com', message: 'Hi' } },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/contacts?templateId=1',
      headers,
    });

    const body = successData(response) as ContactResponse[];
    expect(body).toHaveLength(1);
    expect(body[0]!.templateId).toBe(1);
  });
});

describe('GET /contacts/:id', () => {
  it('should return a contact by id when authorized', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: samplePayload,
    });
    const { id: contactId } = successData(createRes) as ContactResponse;

    const response = await app.inject({ method: 'GET', url: `/contacts/${contactId}`, headers });

    expect(response.statusCode).toBe(200);
    expect((successData(response) as ContactResponse).templateId).toBe(1);
  });

  it('should return 403 for unauthorized access', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: samplePayload,
    });
    const { id: contactId } = successData(createRes) as ContactResponse;

    const response = await app.inject({
      method: 'GET',
      url: `/contacts/${contactId}`,
      headers: { 'x-user-id': 'other-user' },
    });
    expect(response.statusCode).toBe(403);
  });

  it('should return 400 for invalid id', async () => {
    const response = await app.inject({ method: 'GET', url: '/contacts/abc', headers });
    expect(response.statusCode).toBe(400);
  });
});

describe('PATCH /contacts/:id/status', () => {
  it('should update contact status when authorized', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: samplePayload,
    });
    const { id: contactId } = successData(createRes) as ContactResponse;

    const response = await app.inject({
      method: 'PATCH',
      url: `/contacts/${contactId}/status`,
      headers,
      payload: { status: 'in_progress' },
    });

    expect(response.statusCode).toBe(200);
    const body = successData(response) as ContactResponse;
    expect(body.status).toBe('in_progress');
  });

  it('should return 403 for unauthorized update', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: samplePayload,
    });
    const { id: contactId } = successData(createRes) as ContactResponse;

    const response = await app.inject({
      method: 'PATCH',
      url: `/contacts/${contactId}/status`,
      headers: { 'x-user-id': 'other-user' },
      payload: { status: 'in_progress' },
    });
    expect(response.statusCode).toBe(403);
  });

  it('should return 400 for invalid status transition', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: samplePayload,
    });
    const { id: contactId } = successData(createRes) as ContactResponse;

    const response = await app.inject({
      method: 'PATCH',
      url: `/contacts/${contactId}/status`,
      headers,
      payload: { status: 'closed' },
    });
    expect(response.statusCode).toBe(400);
  });
});

describe('DELETE /contacts/:id', () => {
  it('should delete a contact when authorized', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: samplePayload,
    });
    const { id: contactId } = successData(createRes) as ContactResponse;

    const response = await app.inject({ method: 'DELETE', url: `/contacts/${contactId}`, headers });
    expect(response.statusCode).toBe(200);
    expect((response.json() as SuccessEnvelope<null>).success).toBe(1);
    expect((response.json() as SuccessEnvelope<null>).data).toBeNull();

    const getRes = await app.inject({ method: 'GET', url: `/contacts/${contactId}`, headers });
    expect(getRes.statusCode).toBe(403);
  });

  it('should return 403 for unauthorized delete', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: samplePayload,
    });
    const { id: contactId } = successData(createRes) as ContactResponse;

    const response = await app.inject({
      method: 'DELETE',
      url: `/contacts/${contactId}`,
      headers: { 'x-user-id': 'other-user' },
    });
    expect(response.statusCode).toBe(403);
  });
});
