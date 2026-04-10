/**
 * @module cli-openfga-options
 * @description Infrastructure — Commander OpenFGA オプション定義の共有ヘルパー。
 *
 * 複数エントリーポイント (server / setup-openfga) で同じ OpenFGA 接続オプションを再利用する。
 */

import type { Command } from 'commander';
import { Option } from 'commander';
import { parseUrl } from './cli-parsers.js';

export interface RawOpenFgaOptions {
  readonly openfgaUrl: URL;
  readonly openfgaStoreId?: string;
  readonly openfgaModelId?: string;
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
    .addOption(new Option('--openfga-model-id <id>', 'OpenFGA Authorization Model ID').env('OPENFGA_AUTH_MODEL_ID'));
}

export function extractOpenFgaConfig(opts: RawOpenFgaOptions): OpenFgaConfig {
  if (!opts.openfgaStoreId) {
    throw new Error('OpenFGA Store ID is required (--openfga-store-id or OPENFGA_STORE_ID)');
  }
  if (!opts.openfgaModelId) {
    throw new Error('OpenFGA Authorization Model ID is required (--openfga-model-id or OPENFGA_AUTH_MODEL_ID)');
  }
  return {
    apiUrl: opts.openfgaUrl,
    storeId: opts.openfgaStoreId,
    authorizationModelId: opts.openfgaModelId,
  };
}
