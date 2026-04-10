/**
 * @module contact-routes
 * @description Driving Adapter（駆動するアダプター）
 *
 * HTTP リクエストを受け取り、ユースケース（Driving Port）を呼び出す。
 * 外部の技術（Fastify/HTTP）とアプリケーションコアを橋渡しする。
 */

import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { CreateContactUseCase } from '../application/create-contact.js';
import type { DeleteContactUseCase } from '../application/delete-contact.js';
import type { GetContactByIdUseCase } from '../application/get-contact-by-id.js';
import type { GetContactCategoriesUseCase } from '../application/get-contact-categories.js';
import type { GetContactsUseCase } from '../application/get-contacts.js';
import type { UpdateContactStatusUseCase } from '../application/update-contact-status.js';
import { formatContact, formatContactCategories, formatContacts } from './format.js';
import {
  contactCategoriesQuerySchema,
  contactIdParamSchema,
  contactsQuerySchema,
  createContactBodySchema,
  updateContactStatusBodySchema,
} from './schemas.js';

export interface ContactUseCases {
  createContact: CreateContactUseCase;
  getContacts: GetContactsUseCase;
  getContactById: GetContactByIdUseCase;
  updateContactStatus: UpdateContactStatusUseCase;
  deleteContact: DeleteContactUseCase;
  getContactCategories: GetContactCategoriesUseCase;
}

function extractUserId(request: FastifyRequest): string | undefined {
  const header = request.headers['x-user-id'];
  if (typeof header === 'string' && header.length > 0) {
    return header;
  }
  return undefined;
}

export function registerContactRoutes(
  app: FastifyInstance,
  useCases: ContactUseCases,
): void {
  app.get('/contact-categories', async (request) => {
    const query = contactCategoriesQuerySchema.parse(request.query);
    const categories = await useCases.getContactCategories.execute();
    return formatContactCategories(categories, query.locale);
  });

  app.post('/contacts', async (request, reply) => {
    const userId = extractUserId(request);
    if (!userId) {
      return reply.status(401).send({ error: 'Missing X-User-Id header' });
    }
    const body = createContactBodySchema.parse(request.body);
    const contact = await useCases.createContact.execute(userId, body);
    return reply.status(201).send(formatContact(contact));
  });

  app.get('/contacts', async (request, reply) => {
    const userId = extractUserId(request);
    if (!userId) {
      return reply.status(401).send({ error: 'Missing X-User-Id header' });
    }
    const query = contactsQuerySchema.parse(request.query);
    const contacts = await useCases.getContacts.execute(
      userId,
      query.status !== undefined ? { status: query.status } : undefined,
    );
    return formatContacts(contacts);
  });

  app.get('/contacts/:id', async (request, reply) => {
    const userId = extractUserId(request);
    if (!userId) {
      return reply.status(401).send({ error: 'Missing X-User-Id header' });
    }
    const params = contactIdParamSchema.parse(request.params);
    const contact = await useCases.getContactById.execute(userId, params.id);
    return formatContact(contact);
  });

  app.patch('/contacts/:id/status', async (request, reply) => {
    const userId = extractUserId(request);
    if (!userId) {
      return reply.status(401).send({ error: 'Missing X-User-Id header' });
    }
    const params = contactIdParamSchema.parse(request.params);
    const body = updateContactStatusBodySchema.parse(request.body);
    const contact = await useCases.updateContactStatus.execute(userId, params.id, body.status);
    return formatContact(contact);
  });

  app.delete('/contacts/:id', async (request, reply) => {
    const userId = extractUserId(request);
    if (!userId) {
      return reply.status(401).send({ error: 'Missing X-User-Id header' });
    }
    const params = contactIdParamSchema.parse(request.params);
    await useCases.deleteContact.execute(userId, params.id);
    return reply.status(204).send();
  });
}
