/**
 * @module 001-create-tables
 * @description Infrastructure — 全テーブルのマイグレーション定義。
 */

import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('form_templates')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('form_template_translations')
    .addColumn('template_id', 'integer', (col) =>
      col.notNull().references('form_templates.id').onDelete('cascade'))
    .addColumn('locale', 'varchar(10)', (col) => col.notNull())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addPrimaryKeyConstraint('form_template_translations_pkey', ['template_id', 'locale'])
    .execute();

  await db.schema
    .createTable('form_fields')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('template_id', 'integer', (col) =>
      col.notNull().references('form_templates.id').onDelete('cascade'))
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('field_type', 'varchar(50)', (col) => col.notNull())
    .addColumn('validation', 'jsonb', (col) => col.notNull().defaultTo(sql`'{"type":"none"}'::jsonb`))
    .addColumn('is_required', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('display_order', 'integer', (col) => col.notNull())
    .addColumn('options', 'jsonb')
    .addColumn('presentation', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('form_field_translations')
    .addColumn('field_id', 'integer', (col) =>
      col.notNull().references('form_fields.id').onDelete('cascade'))
    .addColumn('locale', 'varchar(10)', (col) => col.notNull())
    .addColumn('label', 'varchar(255)', (col) => col.notNull())
    .addColumn('placeholder', 'varchar(255)', (col) => col.notNull().defaultTo(''))
    .addColumn('help_text', 'varchar(500)', (col) => col.notNull().defaultTo(''))
    .addPrimaryKeyConstraint('form_field_translations_pkey', ['field_id', 'locale'])
    .execute();

  await db.schema
    .createTable('contacts')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('template_id', 'integer', (col) =>
      col.notNull().references('form_templates.id'))
    .addColumn('user_id', 'varchar(255)', (col) => col.notNull())
    .addColumn('data', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('new'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('contacts').execute();
  await db.schema.dropTable('form_field_translations').execute();
  await db.schema.dropTable('form_fields').execute();
  await db.schema.dropTable('form_template_translations').execute();
  await db.schema.dropTable('form_templates').execute();
}
