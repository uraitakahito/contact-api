/**
 * @module 001-create-tables
 * @description Infrastructure — 全テーブルのマイグレーション定義。
 *
 * contact_categories, contact_category_translations, contacts を一括作成する。
 */

import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('contact_categories')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('display_order', 'integer', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('contact_category_translations')
    .addColumn('category_id', 'integer', (col) =>
      col.notNull().references('contact_categories.id').onDelete('cascade'))
    .addColumn('locale', 'varchar(10)', (col) => col.notNull())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addPrimaryKeyConstraint('contact_category_translations_pkey', [
      'category_id',
      'locale',
    ])
    .execute();

  await db.schema
    .createTable('contacts')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('last_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('first_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)', (col) => col.notNull())
    .addColumn('phone', 'varchar(50)')
    .addColumn('category_id', 'integer', (col) =>
      col.notNull().references('contact_categories.id'))
    .addColumn('message', 'text', (col) => col.notNull())
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('new'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('contacts').execute();
  await db.schema.dropTable('contact_category_translations').execute();
  await db.schema.dropTable('contact_categories').execute();
}
