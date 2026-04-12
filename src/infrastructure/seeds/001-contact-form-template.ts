/**
 * @module 001-contact-form-template
 * @description Seed — 問い合わせフォームテンプレートの初期データ投入。
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
    .values({ name: 'contact-form' })
    .returning('id')
    .executeTakeFirstOrThrow();

  const templateId = templateRow.id as number;

  await db
    .insertInto('formTemplateTranslations')
    .values([
      { templateId, locale: 'ja', name: '問い合わせフォーム' },
      { templateId, locale: 'en', name: 'Contact Form' },
    ])
    .execute();

  const fields = await db
    .insertInto('formFields')
    .values([
      { templateId, name: 'lastName', fieldType: 'text', validation: JSON.stringify({ type: 'none' }), isRequired: true, displayOrder: 1, options: null, cssClass: 'form-control', htmlId: 'field-last-name' },
      { templateId, name: 'firstName', fieldType: 'text', validation: JSON.stringify({ type: 'none' }), isRequired: true, displayOrder: 2, options: null, cssClass: 'form-control', htmlId: 'field-first-name' },
      { templateId, name: 'email', fieldType: 'text', validation: JSON.stringify({ type: 'email' }), isRequired: true, displayOrder: 3, options: null, cssClass: 'form-control', htmlId: 'field-email' },
      { templateId, name: 'phone', fieldType: 'text', validation: JSON.stringify({ type: 'phone' }), isRequired: false, displayOrder: 4, options: null, cssClass: 'form-control', htmlId: 'field-phone' },
      {
        templateId, name: 'category', fieldType: 'select', validation: JSON.stringify({ type: 'none' }), isRequired: true, displayOrder: 5,
        options: JSON.stringify([
          { value: 'general', labels: { ja: '一般的なお問合せ', en: 'General Inquiry' } },
          { value: 'product', labels: { ja: '製品/サービスについて', en: 'Products/Services' } },
          { value: 'recruitment', labels: { ja: '採用について', en: 'Recruitment' } },
          { value: 'other', labels: { ja: 'その他', en: 'Other' } },
        ]),
        cssClass: 'form-select', htmlId: 'field-category',
      },
      { templateId, name: 'message', fieldType: 'textarea', validation: JSON.stringify({ type: 'none' }), isRequired: true, displayOrder: 6, options: null, cssClass: 'form-control form-textarea', htmlId: 'field-message' },
    ])
    .returning('id')
    .execute();

  await db
    .insertInto('formFieldTranslations')
    .values([
      { fieldId: getFieldId(fields, 0), locale: 'ja', label: '姓', placeholder: '', helpText: '姓を入力してください' },
      { fieldId: getFieldId(fields, 0), locale: 'en', label: 'Last Name', placeholder: '', helpText: 'Enter your family name' },
      { fieldId: getFieldId(fields, 1), locale: 'ja', label: '名', placeholder: '', helpText: '名を入力してください' },
      { fieldId: getFieldId(fields, 1), locale: 'en', label: 'First Name', placeholder: '', helpText: 'Enter your given name' },
      { fieldId: getFieldId(fields, 2), locale: 'ja', label: 'メールアドレス', placeholder: '例: yamada@example.com', helpText: '返信先として使用します' },
      { fieldId: getFieldId(fields, 2), locale: 'en', label: 'Email', placeholder: 'e.g. yamada@example.com', helpText: 'Used as the reply-to address' },
      { fieldId: getFieldId(fields, 3), locale: 'ja', label: '電話番号', placeholder: '例: 090-1234-5678', helpText: '日中に連絡可能な番号を入力してください' },
      { fieldId: getFieldId(fields, 3), locale: 'en', label: 'Phone', placeholder: 'e.g. 090-1234-5678', helpText: 'A number where we can reach you during business hours' },
      { fieldId: getFieldId(fields, 4), locale: 'ja', label: 'お問い合わせ種別', placeholder: '', helpText: '最も近い種別を選択してください' },
      { fieldId: getFieldId(fields, 4), locale: 'en', label: 'Category', placeholder: '', helpText: 'Select the category that best matches your inquiry' },
      { fieldId: getFieldId(fields, 5), locale: 'ja', label: 'メッセージ', placeholder: '', helpText: 'お問い合わせ内容をできるだけ具体的にご記入ください' },
      { fieldId: getFieldId(fields, 5), locale: 'en', label: 'Message', placeholder: '', helpText: 'Please describe your inquiry in as much detail as possible' },
    ])
    .execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely Migrator の Migration インターフェースに準拠
export async function down(db: Kysely<any>): Promise<void> {
  const row = await db.selectFrom('formTemplates').select('id').where('name', '=', 'contact-form').executeTakeFirst();
  if (!row) return;
  const id = row.id as number;
  await db.deleteFrom('contacts').where('templateId', '=', id).execute();
  await db.deleteFrom('formTemplates').where('id', '=', id).execute();
}
