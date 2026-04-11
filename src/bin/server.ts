/**
 * @module server
 * @description Composition Root — HTTP サーバーのエントリーポイント。
 *
 * DB 接続オプション、OpenFGA オプション、サーバーポートを受け取り、
 * Port と Adapter を結合し、依存性の注入を行う。
 */

import { Command, Option } from 'commander';
import Fastify from 'fastify';
import type { FastifyBaseLogger } from 'fastify';
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
import type { RawContactApiDbOptions } from '../infrastructure/cli-contact-api-db-options.js';
import { addContactApiDbOptions, extractContactApiDbConfig } from '../infrastructure/cli-contact-api-db-options.js';
import type { RawOpenFgaOptions } from '../infrastructure/cli-openfga-options.js';
import { addOpenFgaOptions, extractOpenFgaConfig } from '../infrastructure/cli-openfga-options.js';
import { parsePort } from '../infrastructure/cli-parsers.js';
import { addLogLevelOption } from '../infrastructure/cli-log-level-option.js';
import type { RawLogLevelOption } from '../infrastructure/cli-log-level-option.js';
import { createKyselyClient } from '../infrastructure/connection.js';
import { logger } from '../infrastructure/logger.js';
import { KyselyContactRepository } from '../infrastructure/kysely-contact-repository.js';
import { KyselyFormTemplateRepository } from '../infrastructure/kysely-form-template-repository.js';
import { KyselyValidationMessageRepository } from '../infrastructure/kysely-validation-message-repository.js';
import { createOpenFgaClient } from '../infrastructure/openfga-connection.js';
import { OpenFgaContactAuthorizationService } from '../infrastructure/openfga-contact-authorization-service.js';
import { createErrorHandler } from '../presentation/error-handler.js';
import { ValidationMessageFormatter } from '../presentation/validation-message-formatter.js';
import { registerHealthRoutes } from '../presentation/health-routes.js';
import { registerContactRoutes } from '../presentation/contact-routes.js';
import { registerFormTemplateRoutes } from '../presentation/form-template-routes.js';

// CLI
const program = new Command();
program
  .name('contact-api')
  .description('Contact API server')
  .addOption(new Option('--server-port <port>', 'Server listen port').default(80).argParser(parsePort));

addContactApiDbOptions(program);
addOpenFgaOptions(program);
addLogLevelOption(program);
program.parse();

logger.level = program.opts<RawLogLevelOption>().logLevel;

const opts = program.opts<{ serverPort: number } & RawContactApiDbOptions & RawOpenFgaOptions>();

// Infrastructure
const kyselyClient = createKyselyClient(extractContactApiDbConfig(opts));
const fgaClient = createOpenFgaClient(extractOpenFgaConfig(opts));
const contactRepository = new KyselyContactRepository(kyselyClient);
const formTemplateRepository = new KyselyFormTemplateRepository(kyselyClient);
const authorizationService = new OpenFgaContactAuthorizationService(fgaClient);
const validationMessageRepo = new KyselyValidationMessageRepository(kyselyClient);
const validationTemplates = await validationMessageRepo.findAll();
const formatter = new ValidationMessageFormatter(validationTemplates);

// Application (Use Cases)
const createContact = new CreateContactUseCase(contactRepository, formTemplateRepository, authorizationService);
const getContacts = new GetContactsUseCase(contactRepository, authorizationService);
const getContactById = new GetContactByIdUseCase(contactRepository, authorizationService);
const updateContactStatus = new UpdateContactStatusUseCase(contactRepository, authorizationService);
const deleteContact = new DeleteContactUseCase(contactRepository, authorizationService);
const createFormTemplate = new CreateFormTemplateUseCase(formTemplateRepository);
const getFormTemplates = new GetFormTemplatesUseCase(formTemplateRepository);
const getFormTemplateById = new GetFormTemplateByIdUseCase(formTemplateRepository);
const updateFormTemplate = new UpdateFormTemplateUseCase(formTemplateRepository);
const deleteFormTemplate = new DeleteFormTemplateUseCase(formTemplateRepository);

// Presentation
const app = Fastify({ loggerInstance: logger as FastifyBaseLogger });

app.setErrorHandler(createErrorHandler(formatter));

// Routes
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

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  await app.close();
  await kyselyClient.destroy();
};

process.on('SIGTERM', () => void gracefulShutdown());
process.on('SIGINT', () => void gracefulShutdown());

await app.listen({ port: opts.serverPort, host: '0.0.0.0' });
