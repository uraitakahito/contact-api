/**
 * @module 001-form-templates
 * @description Seed — form_templates / form_fields 等の初期データ投入。
 *
 * JSONB options を含むため CSV ではなく直接 Kysely INSERT を使用する。
 */

import type { Kysely } from 'kysely';
import { sql } from 'kysely';

function getFieldId(ids: { id: unknown }[], index: number): number {
  const row = ids[index];
  if (!row) throw new Error(`Field at index ${index.toString()} not found`);
  return row.id as number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely Migrator の Migration インターフェースに準拠
export async function up(db: Kysely<any>): Promise<void> {
  // --- テンプレート1: 問い合わせフォーム（現行再現） ---
  const t1Row = await db
    .insertInto('formTemplates')
    .values({ name: 'contact-form' })
    .returning('id')
    .executeTakeFirstOrThrow();

  const t1Id = t1Row.id as number;

  await db
    .insertInto('formTemplateTranslations')
    .values([
      { templateId: t1Id, locale: 'ja', name: '問い合わせフォーム' },
      { templateId: t1Id, locale: 'en', name: 'Contact Form' },
    ])
    .execute();

  // Fields for template 1
  const t1Fields = await db
    .insertInto('formFields')
    .values([
      { templateId: t1Id, name: 'lastName', fieldType: 'text', validationType: 'none', isRequired: true, displayOrder: 1, options: null },
      { templateId: t1Id, name: 'firstName', fieldType: 'text', validationType: 'none', isRequired: true, displayOrder: 2, options: null },
      { templateId: t1Id, name: 'email', fieldType: 'text', validationType: 'email', isRequired: true, displayOrder: 3, options: null },
      { templateId: t1Id, name: 'phone', fieldType: 'text', validationType: 'phone', isRequired: false, displayOrder: 4, options: null },
      {
        templateId: t1Id, name: 'category', fieldType: 'select', validationType: 'none', isRequired: true, displayOrder: 5,
        options: JSON.stringify([
          { value: 'general', labels: { ja: '一般的なお問合せ', en: 'General Inquiry' } },
          { value: 'product', labels: { ja: '製品/サービスについて', en: 'Products/Services' } },
          { value: 'recruitment', labels: { ja: '採用について', en: 'Recruitment' } },
          { value: 'other', labels: { ja: 'その他', en: 'Other' } },
        ]),
      },
      { templateId: t1Id, name: 'message', fieldType: 'textarea', validationType: 'none', isRequired: true, displayOrder: 6, options: null },
    ])
    .returning('id')
    .execute();

  // Field translations for template 1
  await db
    .insertInto('formFieldTranslations')
    .values([
      { fieldId: getFieldId(t1Fields, 0), locale: 'ja', label: '姓', placeholder: '' },
      { fieldId: getFieldId(t1Fields, 0), locale: 'en', label: 'Last Name', placeholder: '' },
      { fieldId: getFieldId(t1Fields, 1), locale: 'ja', label: '名', placeholder: '' },
      { fieldId: getFieldId(t1Fields, 1), locale: 'en', label: 'First Name', placeholder: '' },
      { fieldId: getFieldId(t1Fields, 2), locale: 'ja', label: 'メールアドレス', placeholder: '例: yamada@example.com' },
      { fieldId: getFieldId(t1Fields, 2), locale: 'en', label: 'Email', placeholder: 'e.g. yamada@example.com' },
      { fieldId: getFieldId(t1Fields, 3), locale: 'ja', label: '電話番号', placeholder: '例: 090-1234-5678' },
      { fieldId: getFieldId(t1Fields, 3), locale: 'en', label: 'Phone', placeholder: 'e.g. 090-1234-5678' },
      { fieldId: getFieldId(t1Fields, 4), locale: 'ja', label: 'お問い合わせ種別', placeholder: '' },
      { fieldId: getFieldId(t1Fields, 4), locale: 'en', label: 'Category', placeholder: '' },
      { fieldId: getFieldId(t1Fields, 5), locale: 'ja', label: 'メッセージ', placeholder: '' },
      { fieldId: getFieldId(t1Fields, 5), locale: 'en', label: 'Message', placeholder: '' },
    ])
    .execute();

  // --- テンプレート2: シンプルフォーム ---
  const t2Row = await db
    .insertInto('formTemplates')
    .values({ name: 'simple-form' })
    .returning('id')
    .executeTakeFirstOrThrow();

  const t2Id = t2Row.id as number;

  await db
    .insertInto('formTemplateTranslations')
    .values([
      { templateId: t2Id, locale: 'ja', name: 'シンプルフォーム' },
      { templateId: t2Id, locale: 'en', name: 'Simple Form' },
    ])
    .execute();

  // Fields for template 2
  const t2Fields = await db
    .insertInto('formFields')
    .values([
      { templateId: t2Id, name: 'name', fieldType: 'text', validationType: 'none', isRequired: true, displayOrder: 1, options: null },
      { templateId: t2Id, name: 'email', fieldType: 'text', validationType: 'email', isRequired: true, displayOrder: 2, options: null },
      { templateId: t2Id, name: 'message', fieldType: 'textarea', validationType: 'none', isRequired: true, displayOrder: 3, options: null },
    ])
    .returning('id')
    .execute();

  await db
    .insertInto('formFieldTranslations')
    .values([
      { fieldId: getFieldId(t2Fields, 0), locale: 'ja', label: '名前', placeholder: '' },
      { fieldId: getFieldId(t2Fields, 0), locale: 'en', label: 'Name', placeholder: '' },
      { fieldId: getFieldId(t2Fields, 1), locale: 'ja', label: 'メールアドレス', placeholder: '' },
      { fieldId: getFieldId(t2Fields, 1), locale: 'en', label: 'Email', placeholder: '' },
      { fieldId: getFieldId(t2Fields, 2), locale: 'ja', label: 'メッセージ', placeholder: '' },
      { fieldId: getFieldId(t2Fields, 2), locale: 'en', label: 'Message', placeholder: '' },
    ])
    .execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely Migrator の Migration インターフェースに準拠
export async function down(db: Kysely<any>): Promise<void> {
  await sql`TRUNCATE TABLE contacts RESTART IDENTITY CASCADE`.execute(db);
  await sql`TRUNCATE TABLE form_field_translations, form_fields, form_template_translations, form_templates RESTART IDENTITY CASCADE`.execute(db);
}
