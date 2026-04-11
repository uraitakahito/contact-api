/**
 * @module database
 * @description Kysely 用のテーブル型定義。
 *
 * DBスキーマと TypeScript 型のマッピング。
 */

import type { ColumnType, Generated } from 'kysely';

export interface FormTemplateTable {
  id: Generated<number>;
  name: string;
  createdAt: ColumnType<Date, string | undefined, never>;
  updatedAt: ColumnType<Date, string | undefined, string>;
}

export interface FormTemplateTranslationTable {
  templateId: number;
  locale: string;
  name: string;
}

export interface FormFieldTable {
  id: Generated<number>;
  templateId: number;
  name: string;
  fieldType: string;
  validation: unknown;
  isRequired: boolean;
  displayOrder: number;
  options: unknown;
  cssClass: string;
  htmlId: string;
  createdAt: ColumnType<Date, string | undefined, never>;
  updatedAt: ColumnType<Date, string | undefined, string>;
}

export interface FormFieldTranslationTable {
  fieldId: number;
  locale: string;
  label: string;
  placeholder: string;
  helpText: string;
}

export interface ContactTable {
  id: Generated<number>;
  templateId: number;
  userId: string;
  data: unknown;
  status: ColumnType<string, string | undefined, string>;
  createdAt: ColumnType<Date, string | undefined, never>;
  updatedAt: ColumnType<Date, string | undefined, string>;
}

export interface ValidationMessageTable {
  code: string;
  locale: string;
  template: string;
}

export interface Database {
  formTemplates: FormTemplateTable;
  formTemplateTranslations: FormTemplateTranslationTable;
  formFields: FormFieldTable;
  formFieldTranslations: FormFieldTranslationTable;
  contacts: ContactTable;
  validationMessages: ValidationMessageTable;
}
