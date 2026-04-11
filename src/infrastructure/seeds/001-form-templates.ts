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
      { templateId: t1Id, name: 'lastName', fieldType: 'text', validation: JSON.stringify({ type: 'none' }), isRequired: true, displayOrder: 1, options: null, cssClass: 'form-control', htmlId: 'field-last-name' },
      { templateId: t1Id, name: 'firstName', fieldType: 'text', validation: JSON.stringify({ type: 'none' }), isRequired: true, displayOrder: 2, options: null, cssClass: 'form-control', htmlId: 'field-first-name' },
      { templateId: t1Id, name: 'email', fieldType: 'text', validation: JSON.stringify({ type: 'email' }), isRequired: true, displayOrder: 3, options: null, cssClass: 'form-control', htmlId: 'field-email' },
      { templateId: t1Id, name: 'phone', fieldType: 'text', validation: JSON.stringify({ type: 'phone' }), isRequired: false, displayOrder: 4, options: null, cssClass: 'form-control', htmlId: 'field-phone' },
      {
        templateId: t1Id, name: 'category', fieldType: 'select', validation: JSON.stringify({ type: 'none' }), isRequired: true, displayOrder: 5,
        options: JSON.stringify([
          { value: 'general', labels: { ja: '一般的なお問合せ', en: 'General Inquiry' } },
          { value: 'product', labels: { ja: '製品/サービスについて', en: 'Products/Services' } },
          { value: 'recruitment', labels: { ja: '採用について', en: 'Recruitment' } },
          { value: 'other', labels: { ja: 'その他', en: 'Other' } },
        ]),
        cssClass: 'form-select', htmlId: 'field-category',
      },
      { templateId: t1Id, name: 'message', fieldType: 'textarea', validation: JSON.stringify({ type: 'none' }), isRequired: true, displayOrder: 6, options: null, cssClass: 'form-control form-textarea', htmlId: 'field-message' },
    ])
    .returning('id')
    .execute();

  // Field translations for template 1
  await db
    .insertInto('formFieldTranslations')
    .values([
      { fieldId: getFieldId(t1Fields, 0), locale: 'ja', label: '姓', placeholder: '', helpText: '戸籍上の姓を入力してください' },
      { fieldId: getFieldId(t1Fields, 0), locale: 'en', label: 'Last Name', placeholder: '', helpText: 'Enter your family name' },
      { fieldId: getFieldId(t1Fields, 1), locale: 'ja', label: '名', placeholder: '', helpText: '戸籍上の名を入力してください' },
      { fieldId: getFieldId(t1Fields, 1), locale: 'en', label: 'First Name', placeholder: '', helpText: 'Enter your given name' },
      { fieldId: getFieldId(t1Fields, 2), locale: 'ja', label: 'メールアドレス', placeholder: '例: yamada@example.com', helpText: '返信先として使用します' },
      { fieldId: getFieldId(t1Fields, 2), locale: 'en', label: 'Email', placeholder: 'e.g. yamada@example.com', helpText: 'Used as the reply-to address' },
      { fieldId: getFieldId(t1Fields, 3), locale: 'ja', label: '電話番号', placeholder: '例: 090-1234-5678', helpText: '日中に連絡可能な番号を入力してください' },
      { fieldId: getFieldId(t1Fields, 3), locale: 'en', label: 'Phone', placeholder: 'e.g. 090-1234-5678', helpText: 'A number where we can reach you during business hours' },
      { fieldId: getFieldId(t1Fields, 4), locale: 'ja', label: 'お問い合わせ種別', placeholder: '', helpText: '最も近い種別を選択してください' },
      { fieldId: getFieldId(t1Fields, 4), locale: 'en', label: 'Category', placeholder: '', helpText: 'Select the category that best matches your inquiry' },
      { fieldId: getFieldId(t1Fields, 5), locale: 'ja', label: 'メッセージ', placeholder: '', helpText: 'お問い合わせ内容をできるだけ具体的にご記入ください' },
      { fieldId: getFieldId(t1Fields, 5), locale: 'en', label: 'Message', placeholder: '', helpText: 'Please describe your inquiry in as much detail as possible' },
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
      { templateId: t2Id, name: 'name', fieldType: 'text', validation: JSON.stringify({ type: 'none' }), isRequired: true, displayOrder: 1, options: null, cssClass: 'form-control', htmlId: 'field-name' },
      { templateId: t2Id, name: 'email', fieldType: 'text', validation: JSON.stringify({ type: 'email' }), isRequired: true, displayOrder: 2, options: null, cssClass: 'form-control', htmlId: 'field-email' },
      { templateId: t2Id, name: 'message', fieldType: 'textarea', validation: JSON.stringify({ type: 'none' }), isRequired: true, displayOrder: 3, options: null, cssClass: 'form-control form-textarea', htmlId: 'field-message' },
    ])
    .returning('id')
    .execute();

  await db
    .insertInto('formFieldTranslations')
    .values([
      { fieldId: getFieldId(t2Fields, 0), locale: 'ja', label: '名前', placeholder: '', helpText: 'お名前を入力してください' },
      { fieldId: getFieldId(t2Fields, 0), locale: 'en', label: 'Name', placeholder: '', helpText: 'Enter your full name' },
      { fieldId: getFieldId(t2Fields, 1), locale: 'ja', label: 'メールアドレス', placeholder: '', helpText: '返信先として使用します' },
      { fieldId: getFieldId(t2Fields, 1), locale: 'en', label: 'Email', placeholder: '', helpText: 'Used as the reply-to address' },
      { fieldId: getFieldId(t2Fields, 2), locale: 'ja', label: 'メッセージ', placeholder: '', helpText: 'お問い合わせ内容をご記入ください' },
      { fieldId: getFieldId(t2Fields, 2), locale: 'en', label: 'Message', placeholder: '', helpText: 'Please describe your inquiry' },
    ])
    .execute();

  // --- バリデーションメッセージテンプレート ---
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
  await sql`TRUNCATE TABLE contacts RESTART IDENTITY CASCADE`.execute(db);
  await sql`TRUNCATE TABLE validation_messages`.execute(db);
  await sql`TRUNCATE TABLE form_field_translations, form_fields, form_template_translations, form_templates RESTART IDENTITY CASCADE`.execute(db);
}
