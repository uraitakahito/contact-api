import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database } from '../infrastructure/database.js';
import type { FormTemplateResponse } from './format.js';
import { createTestApp } from '../test-helpers/setup.js';

let app: FastifyInstance;
let db: Kysely<Database>;

const headers = { 'x-user-id': 'test-user' };

beforeAll(async () => {
  const testApp = await createTestApp();
  app = testApp.app;
  db = testApp.db;
});

afterEach(async () => {
  // Clean up test-created templates (keep seeds: id 1, 2)
  await sql`DELETE FROM form_templates WHERE id > 2`.execute(db);
});

afterAll(async () => {
  await app.close();
  await db.destroy();
});

describe('GET /form-templates', () => {
  it('should return all templates (no auth required)', async () => {
    const response = await app.inject({ method: 'GET', url: '/form-templates' });

    expect(response.statusCode).toBe(200);
    const body = response.json() as FormTemplateResponse[];
    expect(body).toHaveLength(2);
    expect(body[0]!.name).toBe('contact-form');
    expect(body[0]!.displayName).toBe('Contact Form');
    expect(body[1]!.name).toBe('simple-form');
  });

  it('should return templates with Japanese display names when locale=ja', async () => {
    const response = await app.inject({ method: 'GET', url: '/form-templates?locale=ja' });

    expect(response.statusCode).toBe(200);
    const body = response.json() as FormTemplateResponse[];
    expect(body[0]!.displayName).toBe('問い合わせフォーム');
    expect(body[1]!.displayName).toBe('シンプルフォーム');
  });
});

describe('GET /form-templates/:id', () => {
  it('should return a template with fields (no auth required)', async () => {
    const response = await app.inject({ method: 'GET', url: '/form-templates/1' });

    expect(response.statusCode).toBe(200);
    const body = response.json() as FormTemplateResponse;
    expect(body.name).toBe('contact-form');
    expect(body.fields).toHaveLength(6);
    expect(body.fields[0]!.name).toBe('lastName');
    expect(body.fields[0]!.label).toBe('Last Name');
  });

  it('should resolve field labels by locale', async () => {
    const response = await app.inject({ method: 'GET', url: '/form-templates/1?locale=ja' });

    const body = response.json() as FormTemplateResponse;
    expect(body.fields[0]!.label).toBe('姓');
    expect(body.fields[2]!.label).toBe('メールアドレス');
  });

  it('should include select field options', async () => {
    const response = await app.inject({ method: 'GET', url: '/form-templates/1' });

    const body = response.json() as FormTemplateResponse;
    const categoryField = body.fields.find((f) => f.name === 'category');
    expect(categoryField).toBeDefined();
    expect(categoryField!.options).toHaveLength(4);
    expect(categoryField!.options[0]!.value).toBe('general');
  });

  it('should return 400 for non-existent template', async () => {
    const response = await app.inject({ method: 'GET', url: '/form-templates/999' });
    expect(response.statusCode).toBe(400);
  });
});

describe('POST /form-templates', () => {
  it('should create a template (requires auth)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/form-templates',
      headers,
      payload: {
        name: 'new-form',
        translations: { en: 'New Form', ja: '新フォーム' },
        fields: [
          { name: 'subject', fieldType: 'text', displayOrder: 1, isRequired: true },
          { name: 'body', fieldType: 'textarea', displayOrder: 2, isRequired: true },
        ],
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json() as FormTemplateResponse;
    expect(body.name).toBe('new-form');
    expect(body.fields).toHaveLength(2);
  });

  it('should return 401 without auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/form-templates',
      payload: { name: 'x', fields: [] },
    });
    expect(response.statusCode).toBe(401);
  });
});

describe('PUT /form-templates/:id', () => {
  it('should update a template', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/form-templates',
      headers,
      payload: {
        name: 'editable',
        translations: { en: 'Editable' },
        fields: [{ name: 'a', fieldType: 'text', displayOrder: 1 }],
      },
    });
    const { id } = createRes.json() as FormTemplateResponse;

    const response = await app.inject({
      method: 'PUT',
      url: `/form-templates/${id}`,
      headers,
      payload: {
        name: 'updated',
        translations: { en: 'Updated' },
        fields: [
          { name: 'b', fieldType: 'textarea', displayOrder: 1, isRequired: true },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as FormTemplateResponse;
    expect(body.name).toBe('updated');
    expect(body.fields).toHaveLength(1);
    expect(body.fields[0]!.name).toBe('b');
  });
});

describe('DELETE /form-templates/:id', () => {
  it('should delete a template', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/form-templates',
      headers,
      payload: { name: 'deletable', fields: [] },
    });
    const { id } = createRes.json() as FormTemplateResponse;

    const response = await app.inject({
      method: 'DELETE',
      url: `/form-templates/${id}`,
      headers,
    });
    expect(response.statusCode).toBe(204);

    const getRes = await app.inject({ method: 'GET', url: `/form-templates/${id}` });
    expect(getRes.statusCode).toBe(400);
  });
});
