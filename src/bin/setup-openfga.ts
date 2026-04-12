/**
 * @module setup-openfga
 * @description OpenFGA プロビジョニング CLI エントリーポイント。
 *
 * OpenFGA Store ({@link https://openfga.dev/docs/concepts#what-is-a-store}) と
 * AuthorizationModel ({@link https://openfga.dev/docs/concepts#what-is-an-authorization-model}) を作成し、
 * Store ID / Model ID を標準出力に出力する。
 * オプションで初期 admin ユーザーのタプルも書き込む。
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Command, Option } from 'commander';
import { OpenFgaClient, type WriteAuthorizationModelRequest } from '@openfga/sdk';
import { transformDSLToJSON } from '@openfga/syntax-transformer/dist/transformer/dsltojson.js';
import pino from 'pino';
import { addLogLevelOption } from '../infrastructure/cli-log-level-option.js';
import type { RawLogLevelOption } from '../infrastructure/cli-log-level-option.js';
import { parseUrl } from '../infrastructure/cli-parsers.js';

const logger = pino({ level: process.env['LOG_LEVEL'] ?? 'info' }, process.stderr);

const program = new Command();
program
  .name('setup-openfga')
  .description('Provision OpenFGA store and authorization model')
  .addOption(new Option('--openfga-url <url>', 'OpenFGA API URL').env('OPENFGA_API_URL').default(new URL('http://localhost:8080')).argParser(parseUrl))
  .addOption(new Option('--model-path <path>', 'Path to OpenFGA authorization model (.fga DSL)').env('OPENFGA_MODEL_PATH').default('data/openfga/model.fga'))
  .addOption(new Option('--admin-user <userId>', 'Bootstrap admin user ID'))
  .addOption(new Option('--output-file <path>', 'Write store/model IDs to JSON file'));

addLogLevelOption(program);
program.parse();

const opts = program.opts<{ openfgaUrl: URL; modelPath: string; adminUser?: string; outputFile?: string } & RawLogLevelOption>();
logger.level = opts.logLevel;

const cliLogger = logger.child({ command: 'setup-openfga' });

// 1. Create Store
const client = new OpenFgaClient({ apiUrl: opts.openfgaUrl.origin });

cliLogger.info('Creating OpenFGA store...');
const { id: storeId } = await client.createStore({ name: 'contact-api' });
if (!storeId) {
  cliLogger.error('Failed to create store: no store ID returned');
  process.exitCode = 1;
  process.exit();
}
cliLogger.info({ storeId }, 'Store created');

// 2. Write Authorization Model
const storeClient = new OpenFgaClient({ apiUrl: opts.openfgaUrl.origin, storeId });

const dslContent = await fs.readFile(path.resolve(process.cwd(), opts.modelPath), 'utf-8');
const modelJson = JSON.parse(transformDSLToJSON(dslContent)) as WriteAuthorizationModelRequest;

cliLogger.info('Writing authorization model...');
const { authorization_model_id: modelId } = await storeClient.writeAuthorizationModel(modelJson);
if (!modelId) {
  cliLogger.error('Failed to write model: no model ID returned');
  process.exitCode = 1;
  process.exit();
}
cliLogger.info({ modelId }, 'Authorization model written');

// 3. Optionally write admin tuple
if (opts.adminUser) {
  const adminClient = new OpenFgaClient({
    apiUrl: opts.openfgaUrl.origin,
    storeId,
    authorizationModelId: modelId,
  });

  cliLogger.info({ adminUser: opts.adminUser }, 'Writing admin tuple...');
  await adminClient.write({
    writes: [
      { user: `user:${opts.adminUser}`, relation: 'admin', object: 'system:global' },
    ],
  });
  cliLogger.info('Admin tuple written');
}

// 4. Write config to JSON file if --output-file specified
if (opts.outputFile) {
  await fs.writeFile(opts.outputFile, JSON.stringify({ storeId, authorizationModelId: modelId }));
  cliLogger.info({ outputFile: opts.outputFile }, 'Configuration written to file');
}

// 5. Output for configuration (stdout — can be used with eval)
console.log(`export OPENFGA_STORE_ID=${storeId}`);
console.log(`export OPENFGA_AUTH_MODEL_ID=${modelId}`);
