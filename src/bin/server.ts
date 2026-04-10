/**
 * @module server
 * @description Composition Root — HTTP サーバーのエントリーポイント。
 *
 * Commander.js で DB 接続オプションとサーバーポートを受け取り、
 * Port と Adapter を結合し、依存性の注入を行う。
 */

import { Command, Option } from 'commander';
import Fastify from 'fastify';
import type { FastifyBaseLogger } from 'fastify';
import { CreateContactUseCase } from '../application/create-contact.js';
import { DeleteContactUseCase } from '../application/delete-contact.js';
import { GetContactByIdUseCase } from '../application/get-contact-by-id.js';
import { GetContactCategoriesUseCase } from '../application/get-contact-categories.js';
import { GetContactsUseCase } from '../application/get-contacts.js';
import { UpdateContactStatusUseCase } from '../application/update-contact-status.js';
import type { RawDbOptions } from '../infrastructure/cli-db-options.js';
import { addDbOptions, extractDbConfig } from '../infrastructure/cli-db-options.js';
import { parsePort } from '../infrastructure/cli-parsers.js';
import { addLogLevelOption } from '../infrastructure/cli-log-level-option.js';
import type { RawLogLevelOption } from '../infrastructure/cli-log-level-option.js';
import { createDb } from '../infrastructure/connection.js';
import { logger } from '../infrastructure/logger.js';
import { KyselyContactCategoryRepository } from '../infrastructure/kysely-contact-category-repository.js';
import { KyselyContactRepository } from '../infrastructure/kysely-contact-repository.js';
import { errorHandler } from '../presentation/error-handler.js';
import { registerHealthRoutes } from '../presentation/health-routes.js';
import { registerContactRoutes } from '../presentation/contact-routes.js';

// CLI
const program = new Command();
program
  .name('contact-api')
  .description('Contact API server')
  .addOption(new Option('--port <port>', 'Server listen port').default(3000).argParser(parsePort));

addDbOptions(program);
addLogLevelOption(program);
program.parse();

logger.level = program.opts<RawLogLevelOption>().logLevel;

const opts = program.opts<{ port: number } & RawDbOptions>();

// Infrastructure
const db = createDb(extractDbConfig(opts));
const contactRepository = new KyselyContactRepository(db);
const contactCategoryRepository = new KyselyContactCategoryRepository(db);

// Application (Use Cases)
const createContact = new CreateContactUseCase(contactRepository, contactCategoryRepository);
const getContacts = new GetContactsUseCase(contactRepository);
const getContactById = new GetContactByIdUseCase(contactRepository);
const updateContactStatus = new UpdateContactStatusUseCase(contactRepository);
const deleteContact = new DeleteContactUseCase(contactRepository);
const getContactCategories = new GetContactCategoriesUseCase(contactCategoryRepository);

// Presentation
const app = Fastify({ loggerInstance: logger as FastifyBaseLogger });

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

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  await app.close();
  await db.destroy();
};

process.on('SIGTERM', () => void gracefulShutdown());
process.on('SIGINT', () => void gracefulShutdown());

await app.listen({ port: opts.port, host: '0.0.0.0' });
