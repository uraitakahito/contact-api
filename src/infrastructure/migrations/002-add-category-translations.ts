/**
 * @module 002-add-category-translations
 * @description Infrastructure — contact_category_translations テーブルの追加と
 * contact_categories.name カラムの削除。
 */

import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('contact_category_translations')
    .addColumn('category_id', 'integer', (col) =>
      col.notNull().references('contact_categories.id').onDelete('cascade'))
    .addColumn('locale', 'varchar(10)', (col) => col.notNull())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addPrimaryKeyConstraint('contact_category_translations_pkey', [
      'category_id',
      'locale',
    ])
    .execute();

  await db.schema
    .alterTable('contact_categories')
    .dropColumn('name')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('contact_categories')
    .addColumn('name', 'varchar(255)', (col) => col.notNull().defaultTo(''))
    .execute();

  await db.schema.dropTable('contact_category_translations').execute();
}
