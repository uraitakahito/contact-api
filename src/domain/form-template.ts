/**
 * @module form-template
 * @description ドメインモデル — FormTemplate / FormField エンティティの型定義とバリデーション。
 *
 * フォームテンプレートとフィールドの構造を表現し、外部技術に一切依存しない。
 */

export type FieldType = 'text' | 'textarea' | 'select';

export type ValidationType = 'none' | 'email' | 'phone' | 'url';

export interface FieldTranslation {
  label: string;
  placeholder: string;
}

export interface FormFieldOption {
  value: string;
  labels: Map<string, string>;
}

export interface FormField {
  id: number;
  name: string;
  fieldType: FieldType;
  validationType: ValidationType;
  isRequired: boolean;
  displayOrder: number;
  options: FormFieldOption[];
  translations: Map<string, FieldTranslation>;
}

export interface FormTemplate {
  id: number;
  name: string;
  translations: Map<string, string>;
  fields: FormField[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFormFieldInput {
  name: string;
  fieldType: FieldType;
  validationType: ValidationType;
  isRequired: boolean;
  displayOrder: number;
  options: FormFieldOption[];
  translations: Map<string, FieldTranslation>;
}

export interface CreateFormTemplateInput {
  name: string;
  translations: Map<string, string>;
  fields: CreateFormFieldInput[];
}

export interface UpdateFormTemplateInput {
  name?: string;
  translations?: Map<string, string>;
  fields?: CreateFormFieldInput[];
}

const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const phoneRegex = /^[\d\-+() ]+$/;

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const formatValidators: Record<ValidationType, (value: string) => boolean> = {
  none: () => true,
  email: (v) => emailRegex.test(v),
  phone: (v) => phoneRegex.test(v),
  url: (v) => isValidUrl(v),
};

/**
 * テンプレートのフィールド定義に基づいて送信データをバリデーションする。
 * エラーメッセージの配列を返す（空配列 = valid）。
 */
export function validateContactData(
  fields: readonly FormField[],
  data: Readonly<Record<string, unknown>>,
): string[] {
  const errors: string[] = [];

  for (const field of fields) {
    const value = data[field.name];

    if (field.isRequired) {
      if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`Field '${field.name}' is required`);
        continue;
      }
    }

    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (typeof value !== 'string') {
      errors.push(`Field '${field.name}' must be a string`);
      continue;
    }

    if (field.validationType !== 'none') {
      const validator = formatValidators[field.validationType];
      if (!validator(value)) {
        errors.push(`Field '${field.name}' has invalid ${field.validationType} format`);
      }
    }

    if (field.fieldType === 'select' && field.options.length > 0) {
      const validValues = field.options.map((opt) => opt.value);
      if (!validValues.includes(value)) {
        errors.push(`Field '${field.name}' must be one of: ${validValues.join(', ')}`);
      }
    }
  }

  return errors;
}
