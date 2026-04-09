/**
 * @module 001-contact-categories
 * @description Seed — contact_categories テーブルの初期データ投入。
 */

import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    INSERT INTO contact_categories (name, display_order) VALUES
      ('一般的なお問合せ', 1),
      ('製品/サービスについて', 2),
      ('採用について', 3),
      ('その他', 4)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DELETE FROM contact_categories`.execute(db);
}
