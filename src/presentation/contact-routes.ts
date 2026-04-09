/**
 * @module contact-routes
 * @description Driving Adapter（駆動するアダプター）
 *
 * HTTP リクエストを受け取り、ユースケース（Driving Port）を呼び出す。
 * 外部の技術（Fastify/HTTP）とアプリケーションコアを橋渡しする。
 */

import type { FastifyInstance } from 'fastify';
import type { CreateContactUseCase } from '../application/create-contact.js';
import type { DeleteContactUseCase } from '../application/delete-contact.js';
import type { GetContactByIdUseCase } from '../application/get-contact-by-id.js';
import type { GetContactCategoriesUseCase } from '../application/get-contact-categories.js';
import type { GetContactsUseCase } from '../application/get-contacts.js';
import type { UpdateContactStatusUseCase } from '../application/update-contact-status.js';
import { formatContact, formatContactCategories, formatContacts } from './format.js';
import {
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

export function registerContactRoutes(
  app: FastifyInstance,
  useCases: ContactUseCases,
): void {
  app.get('/contact-categories', async () => {
    const categories = await useCases.getContactCategories.execute();
    return formatContactCategories(categories);
  });

  app.post('/contacts', async (request, reply) => {
    const body = createContactBodySchema.parse(request.body);
    const contact = await useCases.createContact.execute(body);
    return reply.status(201).send(formatContact(contact));
  });

  app.get('/contacts', async (request) => {
    const query = contactsQuerySchema.parse(request.query);
    const contacts = await useCases.getContacts.execute(
      query.status !== undefined ? { status: query.status } : undefined,
    );
    return formatContacts(contacts);
  });

  app.get('/contacts/:id', async (request) => {
    const params = contactIdParamSchema.parse(request.params);
    const contact = await useCases.getContactById.execute(params.id);
    return formatContact(contact);
  });

  app.patch('/contacts/:id/status', async (request) => {
    const params = contactIdParamSchema.parse(request.params);
    const body = updateContactStatusBodySchema.parse(request.body);
    const contact = await useCases.updateContactStatus.execute(params.id, body.status);
    return formatContact(contact);
  });

  app.delete('/contacts/:id', async (request, reply) => {
    const params = contactIdParamSchema.parse(request.params);
    await useCases.deleteContact.execute(params.id);
    return reply.status(204).send();
  });
}
