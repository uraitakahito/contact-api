/**
 * @module main
 * @description Composition Root — 全層を組み立てるエントリーポイント。
 *
 * Port と Adapter を結合し、依存性の注入を行う。
 */

import Fastify from 'fastify';
import { CreateContactUseCase } from './application/create-contact.js';
import { DeleteContactUseCase } from './application/delete-contact.js';
import { GetContactByIdUseCase } from './application/get-contact-by-id.js';
import { GetContactsUseCase } from './application/get-contacts.js';
import { UpdateContactStatusUseCase } from './application/update-contact-status.js';
import { createDb } from './infrastructure/connection.js';
import { KyselyContactRepository } from './infrastructure/kysely-contact-repository.js';
import { errorHandler } from './presentation/error-handler.js';
import { registerHealthRoutes } from './presentation/health-routes.js';
import { registerContactRoutes } from './presentation/contact-routes.js';

// Infrastructure
const db = createDb();
const contactRepository = new KyselyContactRepository(db);

// Application (Use Cases)
const createContact = new CreateContactUseCase(contactRepository);
const getContacts = new GetContactsUseCase(contactRepository);
const getContactById = new GetContactByIdUseCase(contactRepository);
const updateContactStatus = new UpdateContactStatusUseCase(contactRepository);
const deleteContact = new DeleteContactUseCase(contactRepository);

// Presentation
const app = Fastify({ logger: true });

app.setErrorHandler(errorHandler);

registerHealthRoutes(app, db);

registerContactRoutes(app, {
  createContact,
  getContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
});

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  await app.close();
  await db.destroy();
};

process.on('SIGTERM', () => void gracefulShutdown());
process.on('SIGINT', () => void gracefulShutdown());

await app.listen({ port: 3000, host: '0.0.0.0' });
