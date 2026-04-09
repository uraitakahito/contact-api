/**
 * @module 001-contact-categories
 * @description Seed — contact_categories テーブルの初期データ投入。
 *
 * データは data/seeds/contact-categories.csv で管理。
 */

import type { Kysely } from 'kysely';
import { type SeedDefinition, revertSeed, runSeed } from '../seed-runner.js';

const definition: SeedDefinition = {
  tableName: 'contactCategories',
  csvPath: 'data/seeds/contact-categories.csv',
  columns: {
    name: { property: 'name', convert: String },
    display_order: { property: 'displayOrder', convert: Number },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely Migrator の Migration インターフェースに準拠
export async function up(db: Kysely<any>): Promise<void> {
  await runSeed(db, definition);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely Migrator の Migration インターフェースに準拠
export async function down(db: Kysely<any>): Promise<void> {
  await revertSeed(db, definition);
}
