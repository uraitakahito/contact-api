/**
 * @module kysely-contact-category-repository
 * @description Driven Adapter
 *
 * ContactCategoryRepository（Driven Port）の Kysely/PostgreSQL 実装。
 * Domain層のインターフェースを具体的なDB操作に変換する。
 */

import type { Kysely } from 'kysely';
import type { ContactCategory } from '../domain/contact-category.js';
import type { ContactCategoryRepository } from '../domain/contact-category-repository.js';
import type { Database } from './database.js';

export class KyselyContactCategoryRepository implements ContactCategoryRepository {
  private readonly db: Kysely<Database>;

  constructor(db: Kysely<Database>) {
    this.db = db;
  }

  async findAll(): Promise<ContactCategory[]> {
    return this.db
      .selectFrom('contactCategories')
      .selectAll()
      .orderBy('displayOrder', 'asc')
      .execute() as Promise<ContactCategory[]>;
  }

  async findById(id: number): Promise<ContactCategory | undefined> {
    return this.db
      .selectFrom('contactCategories')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst() as Promise<ContactCategory | undefined>;
  }
}
