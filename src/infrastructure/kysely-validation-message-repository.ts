/**
 * @module kysely-validation-message-repository
 * @description Driven Adapter
 *
 * ValidationMessageRepository（Driven Port）の Kysely/PostgreSQL 実装。
 * Domain 層のインターフェースを具体的な DB 操作に変換する。
 *
 * @see {@link file://../domain/validation-message-repository.ts} Driven Port（インターフェース）
 */

import type { Kysely } from 'kysely';
import type { ValidationMessageRepository } from '../domain/validation-message-repository.js';
import type { Database } from './database.js';

export class KyselyValidationMessageRepository implements ValidationMessageRepository {
  private readonly kyselyClient: Kysely<Database>;

  constructor(kyselyClient: Kysely<Database>) {
    this.kyselyClient = kyselyClient;
  }

  async findAll(): Promise<Map<string, Map<string, string>>> {
    const rows = await this.kyselyClient
      .selectFrom('validationMessages')
      .selectAll()
      .execute();

    const result = new Map<string, Map<string, string>>();
    for (const row of rows) {
      let localeMap = result.get(row.code);
      if (!localeMap) {
        localeMap = new Map<string, string>();
        result.set(row.code, localeMap);
      }
      localeMap.set(row.locale, row.template);
    }
    return result;
  }
}
