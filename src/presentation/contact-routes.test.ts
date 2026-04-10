import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Kysely } from 'kysely';
import type { Database } from '../infrastructure/database.js';
import type { InMemoryContactAuthorizationService } from '../test-helpers/in-memory-contact-authorization-service.js';
import type { ContactResponse, ContactCategoryResponse } from './format.js';
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
  lastName: 'Test',
  firstName: 'User',
  email: 'test@example.com',
  categoryId: 1,
  message: 'Test message body',
};

describe('Authentication (X-User-Id)', () => {
  it('should return 401 when X-User-Id header is missing', async () => {
    const response = await app.inject({ method: 'GET', url: '/contacts' });
    expect(response.statusCode).toBe(401);
  });

  it('should return 401 when X-User-Id header is empty', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/contacts',
      headers: { 'x-user-id': '' },
    });
    expect(response.statusCode).toBe(401);
  });
});

describe('GET /contact-categories', () => {
  it('should return all categories in English by default (no auth required)', async () => {
    const response = await app.inject({ method: 'GET', url: '/contact-categories' });

    expect(response.statusCode).toBe(200);
    const body = response.json() as ContactCategoryResponse[];
    expect(body).toHaveLength(4);
    expect(body[0]?.name).toBe('General Inquiry');
    expect(body[1]?.name).toBe('Products/Services');
    expect(body[2]?.name).toBe('Recruitment');
    expect(body[3]?.name).toBe('Other');
  });

  it('should return all categories in Japanese when locale=ja', async () => {
    const response = await app.inject({ method: 'GET', url: '/contact-categories?locale=ja' });

    expect(response.statusCode).toBe(200);
    const body = response.json() as ContactCategoryResponse[];
    expect(body).toHaveLength(4);
    expect(body[0]?.name).toBe('一般的なお問合せ');
    expect(body[1]?.name).toBe('製品/サービスについて');
    expect(body[2]?.name).toBe('採用について');
    expect(body[3]?.name).toBe('その他');
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
    const body = response.json() as ContactResponse;
    expect(body.lastName).toBe('Test');
    expect(body.firstName).toBe('User');
    expect(body.email).toBe('test@example.com');
    expect(body.phone).toBeNull();
    expect(body.categoryId).toBe(1);
    expect(body.message).toBe('Test message body');
    expect(body.status).toBe('new');
    expect(body.id).toBeDefined();
    expect(body.createdAt).toBeDefined();
    expect(body.updatedAt).toBeDefined();
  });

  it('should create a contact with phone', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: { ...samplePayload, phone: '090-1234-5678' },
    });

    expect(response.statusCode).toBe(201);
    expect((response.json() as ContactResponse).phone).toBe('090-1234-5678');
  });

  it('should return 400 for empty lastName', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: { ...samplePayload, lastName: '' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for invalid email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: { ...samplePayload, email: 'not-an-email' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for missing required fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for non-existent categoryId', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: { ...samplePayload, categoryId: 999 },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('GET /contacts', () => {
  it('should return only contacts the user owns', async () => {
    await app.inject({ method: 'POST', url: '/contacts', headers, payload: samplePayload });
    await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: { ...samplePayload, lastName: 'User', firstName: '2' },
    });

    const response = await app.inject({ method: 'GET', url: '/contacts', headers });

    expect(response.statusCode).toBe(200);
    const body = response.json() as ContactResponse[];
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
    const body = response.json() as ContactResponse[];
    expect(body).toHaveLength(0);
  });

  it('should filter by status', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: samplePayload,
    });
    const { id: contactId } = createRes.json() as ContactResponse;

    await app.inject({
      method: 'PATCH',
      url: `/contacts/${contactId}/status`,
      headers,
      payload: { status: 'in_progress' },
    });
    await app.inject({
      method: 'PATCH',
      url: `/contacts/${contactId}/status`,
      headers,
      payload: { status: 'resolved' },
    });
    await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: { ...samplePayload, lastName: 'User', firstName: '2' },
    });

    const resolvedRes = await app.inject({
      method: 'GET',
      url: '/contacts?status=resolved',
      headers,
    });
    const resolvedContacts = resolvedRes.json() as ContactResponse[];
    expect(resolvedContacts).toHaveLength(1);
    expect(resolvedContacts[0]?.status).toBe('resolved');

    const newRes = await app.inject({
      method: 'GET',
      url: '/contacts?status=new',
      headers,
    });
    const newContacts = newRes.json() as ContactResponse[];
    expect(newContacts).toHaveLength(1);
    expect(newContacts[0]?.status).toBe('new');
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
    const { id: contactId } = createRes.json() as ContactResponse;

    const response = await app.inject({ method: 'GET', url: `/contacts/${contactId}`, headers });

    expect(response.statusCode).toBe(200);
    expect((response.json() as ContactResponse).lastName).toBe('Test');
  });

  it('should return 403 for unauthorized access', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: samplePayload,
    });
    const { id: contactId } = createRes.json() as ContactResponse;

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
    const { id: contactId } = createRes.json() as ContactResponse;

    const response = await app.inject({
      method: 'PATCH',
      url: `/contacts/${contactId}/status`,
      headers,
      payload: { status: 'in_progress' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as ContactResponse;
    expect(body.status).toBe('in_progress');
    expect(body.lastName).toBe('Test');
  });

  it('should return 403 for unauthorized update', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/contacts',
      headers,
      payload: samplePayload,
    });
    const { id: contactId } = createRes.json() as ContactResponse;

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
    const { id: contactId } = createRes.json() as ContactResponse;

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
    const { id: contactId } = createRes.json() as ContactResponse;

    const response = await app.inject({ method: 'DELETE', url: `/contacts/${contactId}`, headers });
    expect(response.statusCode).toBe(204);

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
    const { id: contactId } = createRes.json() as ContactResponse;

    const response = await app.inject({
      method: 'DELETE',
      url: `/contacts/${contactId}`,
      headers: { 'x-user-id': 'other-user' },
    });
    expect(response.statusCode).toBe(403);
  });
});
