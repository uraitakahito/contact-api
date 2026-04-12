/**
 * @module 001-validation-messages
 * @description Seed — バリデーションメッセージテンプレートの初期データ投入。
 */

import type { Kysely } from 'kysely';
import { sql } from 'kysely';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely Migrator の Migration インターフェースに準拠
export async function up(db: Kysely<any>): Promise<void> {
  await db
    .insertInto('validationMessages')
    .values([
      { code: 'required', locale: 'ja', template: '{label}は必須です' },
      { code: 'required', locale: 'en', template: '{label} is required' },
      { code: 'invalid_type', locale: 'ja', template: '{label}は文字列で入力してください' },
      { code: 'invalid_type', locale: 'en', template: '{label} must be a string' },
      { code: 'invalid_format', locale: 'ja', template: '{label}の{format}形式が正しくありません' },
      { code: 'invalid_format', locale: 'en', template: '{label} has invalid {format} format' },
      { code: 'too_short', locale: 'ja', template: '{label}は{min}文字以上で入力してください' },
      { code: 'too_short', locale: 'en', template: '{label} must be at least {min} characters' },
      { code: 'too_long', locale: 'ja', template: '{label}は{max}文字以下で入力してください' },
      { code: 'too_long', locale: 'en', template: '{label} must be at most {max} characters' },
      { code: 'invalid_option', locale: 'ja', template: '{label}は次のいずれかを選択してください: {options}' },
      { code: 'invalid_option', locale: 'en', template: '{label} must be one of: {options}' },
    ])
    .execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely Migrator の Migration インターフェースに準拠
export async function down(db: Kysely<any>): Promise<void> {
  await sql`TRUNCATE TABLE validation_messages`.execute(db);
}
