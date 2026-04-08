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
import type { GetContactsUseCase } from '../application/get-contacts.js';
import type { UpdateContactUseCase } from '../application/update-contact.js';
import { formatContact, formatContacts } from './format.js';
import {
  contactIdParamSchema,
  contactsQuerySchema,
  createContactBodySchema,
  updateContactBodySchema,
} from './schemas.js';

export interface ContactUseCases {
  createContact: CreateContactUseCase;
  getContacts: GetContactsUseCase;
  getContactById: GetContactByIdUseCase;
  updateContact: UpdateContactUseCase;
  deleteContact: DeleteContactUseCase;
}

export function registerContactRoutes(
  app: FastifyInstance,
  useCases: ContactUseCases,
): void {
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

  app.put('/contacts/:id', async (request) => {
    const params = contactIdParamSchema.parse(request.params);
    const body = updateContactBodySchema.parse(request.body);
    const contact = await useCases.updateContact.execute(params.id, body);
    return formatContact(contact);
  });

  app.delete('/contacts/:id', async (request, reply) => {
    const params = contactIdParamSchema.parse(request.params);
    await useCases.deleteContact.execute(params.id);
    return reply.status(204).send();
  });
}
