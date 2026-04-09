import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { FileMigrationProvider, type Kysely, Migrator, sql } from 'kysely';
import { CreateContactUseCase } from '../application/create-contact.js';
import { DeleteContactUseCase } from '../application/delete-contact.js';
import { GetContactByIdUseCase } from '../application/get-contact-by-id.js';
import { GetContactCategoriesUseCase } from '../application/get-contact-categories.js';
import { GetContactsUseCase } from '../application/get-contacts.js';
import { UpdateContactStatusUseCase } from '../application/update-contact-status.js';
import { createDb } from '../infrastructure/connection.js';
import type { Database } from '../infrastructure/database.js';
import { KyselyContactCategoryRepository } from '../infrastructure/kysely-contact-category-repository.js';
import { KyselyContactRepository } from '../infrastructure/kysely-contact-repository.js';
import * as contactCategoriesSeed from '../infrastructure/seeds/001-contact-categories.js';
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

/**
 * テスト用シード投入。
 * 外部からの seed 操作（npm run seed / seed:down）で DB の ID シーケンスや
 * kysely_seed 追跡テーブルが不整合になっても、テストが安定して動作するよう
 * 毎回 TRUNCATE → 再投入する。
 *
 * FileMigrationProvider の動的 import() は @vite-ignore により vitest の
 * モジュール解決を経由しないため、静的インポートで seed モジュールを直接呼ぶ。
 */
export async function runSeeds(db: Kysely<Database>): Promise<void> {
  await sql`TRUNCATE TABLE contacts, contact_category_translations, contact_categories RESTART IDENTITY CASCADE`.execute(db);
  await contactCategoriesSeed.up(db);
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
  await runSeeds(db);

  const contactRepository = new KyselyContactRepository(db);
  const contactCategoryRepository = new KyselyContactCategoryRepository(db);
  const createContact = new CreateContactUseCase(contactRepository, contactCategoryRepository);
  const getContacts = new GetContactsUseCase(contactRepository);
  const getContactById = new GetContactByIdUseCase(contactRepository);
  const updateContactStatus = new UpdateContactStatusUseCase(contactRepository);
  const deleteContact = new DeleteContactUseCase(contactRepository);
  const getContactCategories = new GetContactCategoriesUseCase(contactCategoryRepository);

  const app = Fastify({ logger: false });
  app.setErrorHandler(errorHandler);
  registerHealthRoutes(app, db);
  registerContactRoutes(app, {
    createContact,
    getContacts,
    getContactById,
    updateContactStatus,
    deleteContact,
    getContactCategories,
  });

  return { app, db };
}
