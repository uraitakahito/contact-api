/**
 * @module 001-create-contacts
 * @description Infrastructure — contact_categories / contacts テーブルのマイグレーション定義。
 */

import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('contact_categories')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('display_order', 'integer', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`
    INSERT INTO contact_categories (name, display_order) VALUES
      ('一般的なお問合せ', 1),
      ('製品/サービスについて', 2),
      ('採用について', 3),
      ('その他', 4)
  `.execute(db);

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
  await db.schema.dropTable('contact_categories').execute();
}
