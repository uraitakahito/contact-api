import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import type { FastifyBaseLogger, FastifyInstance } from 'fastify';
import { FileMigrationProvider, type Kysely, Migrator, sql } from 'kysely';
import { CreateContactUseCase } from '../application/create-contact.js';
import { CreateFormTemplateUseCase } from '../application/create-form-template.js';
import { DeleteContactUseCase } from '../application/delete-contact.js';
import { DeleteFormTemplateUseCase } from '../application/delete-form-template.js';
import { GetContactByIdUseCase } from '../application/get-contact-by-id.js';
import { GetContactsUseCase } from '../application/get-contacts.js';
import { GetFormTemplateByIdUseCase } from '../application/get-form-template-by-id.js';
import { GetFormTemplatesUseCase } from '../application/get-form-templates.js';
import { UpdateContactStatusUseCase } from '../application/update-contact-status.js';
import { UpdateFormTemplateUseCase } from '../application/update-form-template.js';
import { createKyselyClient } from '../infrastructure/connection.js';
import type { Database } from '../infrastructure/database.js';
import { KyselyContactRepository } from '../infrastructure/kysely-contact-repository.js';
import { KyselyFormTemplateRepository } from '../infrastructure/kysely-form-template-repository.js';
import { KyselyValidationMessageRepository } from '../infrastructure/kysely-validation-message-repository.js';
import { logger } from '../infrastructure/logger.js';
import * as formTemplatesSeed from '../infrastructure/seeds/001-form-templates.js';
import { createErrorHandler } from '../presentation/error-handler.js';
import { ValidationMessageFormatter } from '../presentation/validation-message-formatter.js';
import { registerHealthRoutes } from '../presentation/health-routes.js';
import { registerContactRoutes } from '../presentation/contact-routes.js';
import { registerFormTemplateRoutes } from '../presentation/form-template-routes.js';
import { InMemoryContactAuthorizationService } from './in-memory-contact-authorization-service.js';


export function createTestKyselyClient(): Kysely<Database> {
  return createKyselyClient({
    host: process.env['CONTACT_API_DB_HOST'] ?? 'localhost',
    port: Number(process.env['CONTACT_API_DB_PORT'] ?? 5432),
    user: process.env['CONTACT_API_DB_USER'],
    password: process.env['CONTACT_API_DB_PASSWORD'],
    database: process.env['CONTACT_API_DB_NAME'] ?? 'contact_api_test',
    max: 10,
  });
}

export async function runMigrations(kyselyClient: Kysely<Database>): Promise<void> {
  const migrator = new Migrator({
    db: kyselyClient,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: fileURLToPath(new URL('../infrastructure/migrations', import.meta.url)),
    }),
  });

  const { error } = await migrator.migrateToLatest();
  if (error) {
    throw error instanceof Error ? error : new Error('Migration failed');
  }
}

/**
 * テスト用シード投入。
 * 毎回 TRUNCATE → 再投入する。
 */
export async function runSeeds(kyselyClient: Kysely<Database>): Promise<void> {
  await sql`TRUNCATE TABLE contacts, validation_messages, form_field_translations, form_fields, form_template_translations, form_templates RESTART IDENTITY CASCADE`.execute(kyselyClient);
  await formTemplatesSeed.up(kyselyClient);
}

export async function cleanDatabase(
  kyselyClient: Kysely<Database>,
  authz?: InMemoryContactAuthorizationService,
): Promise<void> {
  await sql`TRUNCATE TABLE contacts RESTART IDENTITY CASCADE`.execute(kyselyClient);
  authz?.clear();
}

export interface TestApp {
  app: FastifyInstance;
  kyselyClient: Kysely<Database>;
  authz: InMemoryContactAuthorizationService;
}

export async function createTestApp(): Promise<TestApp> {
  const kyselyClient = createTestKyselyClient();
  await runMigrations(kyselyClient);
  await runSeeds(kyselyClient);

  const authz = new InMemoryContactAuthorizationService();
  const validationMessageRepo = new KyselyValidationMessageRepository(kyselyClient);
  const validationTemplates = await validationMessageRepo.findAll();
  const validationFormatter = new ValidationMessageFormatter(validationTemplates);
  const contactRepository = new KyselyContactRepository(kyselyClient);
  const formTemplateRepository = new KyselyFormTemplateRepository(kyselyClient);
  const createContact = new CreateContactUseCase(contactRepository, formTemplateRepository, authz);
  const getContacts = new GetContactsUseCase(contactRepository, authz);
  const getContactById = new GetContactByIdUseCase(contactRepository, authz);
  const updateContactStatus = new UpdateContactStatusUseCase(contactRepository, authz);
  const deleteContact = new DeleteContactUseCase(contactRepository, authz);
  const createFormTemplate = new CreateFormTemplateUseCase(formTemplateRepository);
  const getFormTemplates = new GetFormTemplatesUseCase(formTemplateRepository);
  const getFormTemplateById = new GetFormTemplateByIdUseCase(formTemplateRepository);
  const updateFormTemplate = new UpdateFormTemplateUseCase(formTemplateRepository);
  const deleteFormTemplate = new DeleteFormTemplateUseCase(formTemplateRepository);

  const app = Fastify({ loggerInstance: logger as FastifyBaseLogger });
  app.setErrorHandler(createErrorHandler(validationFormatter));
  registerHealthRoutes(app, kyselyClient);
  registerContactRoutes(app, {
    createContact,
    getContacts,
    getContactById,
    updateContactStatus,
    deleteContact,
  });
  registerFormTemplateRoutes(app, {
    createFormTemplate,
    getFormTemplates,
    getFormTemplateById,
    updateFormTemplate,
    deleteFormTemplate,
  });

  return { app, kyselyClient, authz };
}
