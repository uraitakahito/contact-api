/**
 * @module kysely-contact-category-repository
 * @description Driven Adapter
 *
 * ContactCategoryRepository（Driven Port）の Kysely/PostgreSQL 実装。
 * Domain層のインターフェースを具体的なDB操作に変換する。
 *
 * @see {@link file://../domain/contact-category-repository.ts} Driven Port（インターフェース）
 */

import type { Kysely } from 'kysely';
import type { ContactCategory } from '../domain/contact-category.js';
import type { ContactCategoryRepository } from '../domain/contact-category-repository.js';
import type { Database } from './database.js';

interface CategoryRow {
  id: number;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  locale: string | null;
  name: string | null;
}

function groupByCategory(rows: CategoryRow[]): ContactCategory[] {
  const map = new Map<number, ContactCategory>();

  for (const row of rows) {
    let category = map.get(row.id);
    if (!category) {
      category = {
        id: row.id,
        translations: new Map<string, string>(),
        displayOrder: row.displayOrder,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
      map.set(row.id, category);
    }
    if (row.locale !== null && row.name !== null) {
      category.translations.set(row.locale, row.name);
    }
  }

  return [...map.values()];
}

export class KyselyContactCategoryRepository implements ContactCategoryRepository {
  private readonly db: Kysely<Database>;

  constructor(db: Kysely<Database>) {
    this.db = db;
  }

  async findAll(): Promise<ContactCategory[]> {
    const rows = await this.db
      .selectFrom('contactCategories')
      .leftJoin(
        'contactCategoryTranslations',
        'contactCategories.id',
        'contactCategoryTranslations.categoryId',
      )
      .select([
        'contactCategories.id',
        'contactCategories.displayOrder',
        'contactCategories.createdAt',
        'contactCategories.updatedAt',
        'contactCategoryTranslations.locale',
        'contactCategoryTranslations.name',
      ])
      .orderBy('contactCategories.displayOrder', 'asc')
      .execute();

    return groupByCategory(rows as CategoryRow[]);
  }

  async findById(id: number): Promise<ContactCategory | undefined> {
    const rows = await this.db
      .selectFrom('contactCategories')
      .leftJoin(
        'contactCategoryTranslations',
        'contactCategories.id',
        'contactCategoryTranslations.categoryId',
      )
      .select([
        'contactCategories.id',
        'contactCategories.displayOrder',
        'contactCategories.createdAt',
        'contactCategories.updatedAt',
        'contactCategoryTranslations.locale',
        'contactCategoryTranslations.name',
      ])
      .where('contactCategories.id', '=', id)
      .execute();

    const categories = groupByCategory(rows as CategoryRow[]);
    return categories[0];
  }
}
