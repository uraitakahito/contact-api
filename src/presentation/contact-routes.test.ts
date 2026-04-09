import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Kysely } from 'kysely';
import type { Database } from '../infrastructure/database.js';
import type { ContactCategoryResponse, ContactResponse } from './format.js';
import { cleanDatabase, createTestApp } from '../test-helpers/setup.js';

let app: FastifyInstance;
let db: Kysely<Database>;

beforeAll(async () => {
  const testApp = await createTestApp();
  app = testApp.app;
  db = testApp.db;
});

afterEach(async () => {
  await cleanDatabase(db);
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

describe('GET /contact-categories', () => {
  it('should return all categories', async () => {
    const response = await app.inject({ method: 'GET', url: '/contact-categories' });

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
      payload: { ...samplePayload, phone: '090-1234-5678' },
    });

    expect(response.statusCode).toBe(201);
    expect((response.json() as ContactResponse).phone).toBe('090-1234-5678');
  });

  it('should return 400 for empty lastName', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/contacts',
      payload: { ...samplePayload, lastName: '' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for invalid email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/contacts',
      payload: { ...samplePayload, email: 'not-an-email' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for missing required fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/contacts',
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for non-existent categoryId', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/contacts',
      payload: { ...samplePayload, categoryId: 999 },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('GET /contacts', () => {
  it('should return all contacts', async () => {
    await app.inject({ method: 'POST', url: '/contacts', payload: samplePayload });
    await app.inject({
      method: 'POST',
      url: '/contacts',
      payload: { ...samplePayload, lastName: 'User', firstName: '2' },
    });

    const response = await app.inject({ method: 'GET', url: '/contacts' });

    expect(response.statusCode).toBe(200);
    const body = response.json() as ContactResponse[];
    expect(body).toHaveLength(2);
  });

  it('should filter by status', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/contacts',
      payload: samplePayload,
    });
    const { id: contactId } = createRes.json() as ContactResponse;

    await app.inject({
      method: 'PATCH',
      url: `/contacts/${contactId}/status`,
      payload: { status: 'in_progress' },
    });
    await app.inject({
      method: 'PATCH',
      url: `/contacts/${contactId}/status`,
      payload: { status: 'resolved' },
    });
    await app.inject({
      method: 'POST',
      url: '/contacts',
      payload: { ...samplePayload, lastName: 'User', firstName: '2' },
    });

    const resolvedRes = await app.inject({
      method: 'GET',
      url: '/contacts?status=resolved',
    });
    const resolvedContacts = resolvedRes.json() as ContactResponse[];
    expect(resolvedContacts).toHaveLength(1);
    expect(resolvedContacts[0]?.status).toBe('resolved');

    const newRes = await app.inject({
      method: 'GET',
      url: '/contacts?status=new',
    });
    const newContacts = newRes.json() as ContactResponse[];
    expect(newContacts).toHaveLength(1);
    expect(newContacts[0]?.status).toBe('new');
  });
});

describe('GET /contacts/:id', () => {
  it('should return a contact by id', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/contacts',
      payload: samplePayload,
    });
    const { id: contactId } = createRes.json() as ContactResponse;

    const response = await app.inject({ method: 'GET', url: `/contacts/${contactId}` });

    expect(response.statusCode).toBe(200);
    expect((response.json() as ContactResponse).lastName).toBe('Test');
  });

  it('should return 404 for non-existent contact', async () => {
    const response = await app.inject({ method: 'GET', url: '/contacts/999' });
    expect(response.statusCode).toBe(404);
  });

  it('should return 400 for invalid id', async () => {
    const response = await app.inject({ method: 'GET', url: '/contacts/abc' });
    expect(response.statusCode).toBe(400);
  });
});

describe('PATCH /contacts/:id/status', () => {
  it('should update contact status', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/contacts',
      payload: samplePayload,
    });
    const { id: contactId } = createRes.json() as ContactResponse;

    const response = await app.inject({
      method: 'PATCH',
      url: `/contacts/${contactId}/status`,
      payload: { status: 'in_progress' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as ContactResponse;
    expect(body.status).toBe('in_progress');
    expect(body.lastName).toBe('Test');
  });

  it('should return 404 for non-existent contact', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/contacts/999/status',
      payload: { status: 'in_progress' },
    });
    expect(response.statusCode).toBe(404);
  });

  it('should return 400 for invalid status transition', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/contacts',
      payload: samplePayload,
    });
    const { id: contactId } = createRes.json() as ContactResponse;

    const response = await app.inject({
      method: 'PATCH',
      url: `/contacts/${contactId}/status`,
      payload: { status: 'closed' },
    });
    expect(response.statusCode).toBe(400);
  });
});

describe('DELETE /contacts/:id', () => {
  it('should delete a contact', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/contacts',
      payload: samplePayload,
    });
    const { id: contactId } = createRes.json() as ContactResponse;

    const response = await app.inject({ method: 'DELETE', url: `/contacts/${contactId}` });
    expect(response.statusCode).toBe(204);

    const getRes = await app.inject({ method: 'GET', url: `/contacts/${contactId}` });
    expect(getRes.statusCode).toBe(404);
  });

  it('should return 404 for non-existent contact', async () => {
    const response = await app.inject({ method: 'DELETE', url: '/contacts/999' });
    expect(response.statusCode).toBe(404);
  });
});
