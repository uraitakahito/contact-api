/**
 * @module 003-simple-form-template
 * @description Seed — シンプルフォームテンプレートの初期データ投入。
 *
 * 自動採番 ID への FK 依存があるため、Migrator の up/down に Kysely INSERT を直接記述する。
 */

import type { Kysely } from 'kysely';

function getFieldId(ids: { id: unknown }[], index: number): number {
  const row = ids[index];
  if (!row) throw new Error(`Field at index ${index.toString()} not found`);
  return row.id as number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely Migrator の Migration インターフェースに準拠
export async function up(db: Kysely<any>): Promise<void> {
  const templateRow = await db
    .insertInto('formTemplates')
    .values({ name: 'simple-form' })
    .returning('id')
    .executeTakeFirstOrThrow();

  const templateId = templateRow.id as number;

  await db
    .insertInto('formTemplateTranslations')
    .values([
      { templateId, locale: 'ja', name: 'シンプルフォーム' },
      { templateId, locale: 'en', name: 'Simple Form' },
    ])
    .execute();

  const fields = await db
    .insertInto('formFields')
    .values([
      { templateId, name: 'name', fieldType: 'text', validation: JSON.stringify({ type: 'none' }), isRequired: true, displayOrder: 1, options: null, cssClass: 'form-control', htmlId: 'field-name' },
      { templateId, name: 'email', fieldType: 'text', validation: JSON.stringify({ type: 'email' }), isRequired: true, displayOrder: 2, options: null, cssClass: 'form-control', htmlId: 'field-email' },
      { templateId, name: 'message', fieldType: 'textarea', validation: JSON.stringify({ type: 'none' }), isRequired: true, displayOrder: 3, options: null, cssClass: 'form-control form-textarea', htmlId: 'field-message' },
    ])
    .returning('id')
    .execute();

  await db
    .insertInto('formFieldTranslations')
    .values([
      { fieldId: getFieldId(fields, 0), locale: 'ja', label: '名前', placeholder: '', helpText: 'お名前を入力してください' },
      { fieldId: getFieldId(fields, 0), locale: 'en', label: 'Name', placeholder: '', helpText: 'Enter your full name' },
      { fieldId: getFieldId(fields, 1), locale: 'ja', label: 'メールアドレス', placeholder: '', helpText: '返信先として使用します' },
      { fieldId: getFieldId(fields, 1), locale: 'en', label: 'Email', placeholder: '', helpText: 'Used as the reply-to address' },
      { fieldId: getFieldId(fields, 2), locale: 'ja', label: 'メッセージ', placeholder: '', helpText: 'お問い合わせ内容をご記入ください' },
      { fieldId: getFieldId(fields, 2), locale: 'en', label: 'Message', placeholder: '', helpText: 'Please describe your inquiry' },
    ])
    .execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely Migrator の Migration インターフェースに準拠
export async function down(db: Kysely<any>): Promise<void> {
  const row = await db.selectFrom('formTemplates').select('id').where('name', '=', 'simple-form').executeTakeFirst();
  if (!row) return;
  const id = row.id as number;
  await db.deleteFrom('contacts').where('templateId', '=', id).execute();
  await db.deleteFrom('formTemplates').where('id', '=', id).execute();
}
