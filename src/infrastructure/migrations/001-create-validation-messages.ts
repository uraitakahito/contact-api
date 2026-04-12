/**
 * @module 001-create-validation-messages
 * @description Infrastructure — validation_messages テーブルのマイグレーション定義。
 *
 * 他テーブルへの FK を持たない独立したテーブルのため、専用のマイグレーションとして分離。
 */

import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('validation_messages')
    .addColumn('code', 'varchar(50)', (col) => col.notNull())
    .addColumn('locale', 'varchar(10)', (col) => col.notNull())
    .addColumn('template', 'text', (col) => col.notNull())
    .addPrimaryKeyConstraint('validation_messages_pkey', ['code', 'locale'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('validation_messages').execute();
}
