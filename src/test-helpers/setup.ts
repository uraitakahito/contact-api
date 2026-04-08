import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { FileMigrationProvider, type Kysely, Migrator, sql } from 'kysely';
import { CreateContactUseCase } from '../application/create-contact.js';
import { DeleteContactUseCase } from '../application/delete-contact.js';
import { GetContactByIdUseCase } from '../application/get-contact-by-id.js';
import { GetContactsUseCase } from '../application/get-contacts.js';
import { UpdateContactUseCase } from '../application/update-contact.js';
import { createDb } from '../infrastructure/connection.js';
import type { Database } from '../infrastructure/database.js';
import { KyselyContactRepository } from '../infrastructure/kysely-contact-repository.js';
import { errorHandler } from '../presentation/error-handler.js';
import { registerHealthRoutes } from '../presentation/health-routes.js';
import { registerContactRoutes } from '../presentation/contact-routes.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export function createTestDb(): Kysely<Database> {
  return createDb({
    database: process.env['DATABASE_NAME'] ?? 'contact_api_test',
  });
}

export async function runMigrations(db: Kysely<Database>): Promise<void> {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(currentDir, '..', 'infrastructure', 'migrations'),
    }),
  });

  const { error } = await migrator.migrateToLatest();
  if (error) {
    throw error instanceof Error ? error : new Error('Migration failed');
  }
}

export async function cleanDatabase(db: Kysely<Database>): Promise<void> {
  await sql`TRUNCATE TABLE contacts RESTART IDENTITY CASCADE`.execute(db);
}

export interface TestApp {
  app: FastifyInstance;
  db: Kysely<Database>;
}

export async function createTestApp(): Promise<TestApp> {
  const db = createTestDb();
  await runMigrations(db);

  const contactRepository = new KyselyContactRepository(db);
  const createContact = new CreateContactUseCase(contactRepository);
  const getContacts = new GetContactsUseCase(contactRepository);
  const getContactById = new GetContactByIdUseCase(contactRepository);
  const updateContact = new UpdateContactUseCase(contactRepository);
  const deleteContact = new DeleteContactUseCase(contactRepository);

  const app = Fastify({ logger: false });
  app.setErrorHandler(errorHandler);
  registerHealthRoutes(app, db);
  registerContactRoutes(app, {
    createContact,
    getContacts,
    getContactById,
    updateContact,
    deleteContact,
  });

  return { app, db };
}
