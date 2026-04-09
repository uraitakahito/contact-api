/**
 * @module 001-contact-categories
 * @description Seed — contact_categories / contact_category_translations テーブルの初期データ投入。
 *
 * データは data/seeds/contact-categories.csv, data/seeds/contact-category-translations.csv で管理。
 */

import type { Kysely } from 'kysely';
import { type SeedDefinition, revertSeed, runSeed } from '../seed-runner.js';

const categoryDefinition: SeedDefinition = {
  tableName: 'contactCategories',
  csvPath: 'data/seeds/contact-categories.csv',
  columns: {
    display_order: { property: 'displayOrder', convert: Number },
  },
};

const translationDefinition: SeedDefinition = {
  tableName: 'contactCategoryTranslations',
  csvPath: 'data/seeds/contact-category-translations.csv',
  columns: {
    category_id: { property: 'categoryId', convert: Number },
    locale: { property: 'locale', convert: String },
    name: { property: 'name', convert: String },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely Migrator の Migration インターフェースに準拠
export async function up(db: Kysely<any>): Promise<void> {
  await runSeed(db, categoryDefinition);
  await runSeed(db, translationDefinition);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely Migrator の Migration インターフェースに準拠
export async function down(db: Kysely<any>): Promise<void> {
  await revertSeed(db, translationDefinition);
  await revertSeed(db, categoryDefinition);
}
