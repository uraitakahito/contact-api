/**
 * @module openfga-connection
 * @description OpenFGA クライアント接続ファクトリ。
 *
 * Driven Adapter が使用する OpenFGA クライアントを生成する。
 */

import { OpenFgaClient } from '@openfga/sdk';
import type { OpenFgaConfig } from './cli-openfga-options.js';

export function createOpenFgaClient(config: OpenFgaConfig): OpenFgaClient {
  return new OpenFgaClient({
    apiUrl: config.apiUrl.href,
    storeId: config.storeId,
    authorizationModelId: config.authorizationModelId,
  });
}
