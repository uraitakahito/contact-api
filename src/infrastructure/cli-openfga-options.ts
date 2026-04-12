/**
 * @module cli-openfga-options
 * @description Infrastructure — Commander OpenFGA オプション定義の共有ヘルパー。
 *
 * 複数エントリーポイント (server / setup-openfga) で同じ OpenFGA 接続オプションを再利用する。
 */

import { readFileSync } from 'node:fs';
import type { Command } from 'commander';
import { Option } from 'commander';
import { parseUrl } from './cli-parsers.js';

export interface RawOpenFgaOptions {
  readonly openfgaUrl: URL;
  readonly openfgaStoreId?: string;
  readonly openfgaModelId?: string;
  readonly openfgaConfigFile?: string;
}

export interface OpenFgaConfig {
  readonly apiUrl: URL;
  readonly storeId: string;
  readonly authorizationModelId: string;
}

export function addOpenFgaOptions(cmd: Command): Command {
  return cmd
    .addOption(new Option('--openfga-url <url>', 'OpenFGA API URL').env('OPENFGA_API_URL').default(new URL('http://localhost:8080')).argParser(parseUrl))
    .addOption(new Option('--openfga-store-id <id>', 'OpenFGA Store ID').env('OPENFGA_STORE_ID'))
    .addOption(new Option('--openfga-model-id <id>', 'OpenFGA Authorization Model ID').env('OPENFGA_AUTH_MODEL_ID'))
    .addOption(new Option('--openfga-config-file <path>', 'Path to OpenFGA config JSON file (fallback for store/model IDs)').env('OPENFGA_CONFIG_FILE'));
}

interface OpenFgaConfigFile {
  storeId: string;
  authorizationModelId: string;
}

export function extractOpenFgaConfig(opts: RawOpenFgaOptions): OpenFgaConfig {
  let storeId = opts.openfgaStoreId;
  let authorizationModelId = opts.openfgaModelId;

  if ((!storeId || !authorizationModelId) && opts.openfgaConfigFile) {
    const fileConfig = JSON.parse(readFileSync(opts.openfgaConfigFile, 'utf-8')) as OpenFgaConfigFile;
    storeId ??= fileConfig.storeId;
    authorizationModelId ??= fileConfig.authorizationModelId;
  }

  if (!storeId) {
    throw new Error('OpenFGA Store ID is required (--openfga-store-id, OPENFGA_STORE_ID, or --openfga-config-file)');
  }
  if (!authorizationModelId) {
    throw new Error('OpenFGA Authorization Model ID is required (--openfga-model-id, OPENFGA_AUTH_MODEL_ID, or --openfga-config-file)');
  }
  return {
    apiUrl: opts.openfgaUrl,
    storeId,
    authorizationModelId,
  };
}
