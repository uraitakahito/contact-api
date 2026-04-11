/**
 * @module form-template
 * @description ドメインモデル — FormTemplate / FormField エンティティの型定義とバリデーション。
 *
 * フォームテンプレートとフィールドの構造を表現し、外部技術に一切依存しない。
 */

export type FieldType = 'text' | 'textarea' | 'select';

export type ValidationType = 'none' | 'email' | 'phone' | 'url';

export interface FieldValidation {
  type: ValidationType;
  minLength?: number | undefined;
  maxLength?: number | undefined;
}

export interface FieldPresentation {
  cssClass?: string | undefined;
  htmlId?: string | undefined;
}

export interface FieldTranslation {
  label: string;
  placeholder: string;
  helpText: string;
}

export interface FormFieldOption {
  value: string;
  labels: Map<string, string>;
}

export interface FormField {
  id: number;
  name: string;
  fieldType: FieldType;
  validation: FieldValidation;
  isRequired: boolean;
  displayOrder: number;
  options: FormFieldOption[];
  presentation: FieldPresentation;
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
  validation: FieldValidation;
  isRequired: boolean;
  displayOrder: number;
  options: FormFieldOption[];
  presentation: FieldPresentation;
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

export type ValidationErrorCode = 'required' | 'invalid_type' | 'invalid_format' | 'too_short' | 'too_long' | 'invalid_option';

export interface FieldValidationError {
  field: string;
  code: ValidationErrorCode;
  params: Record<string, string | number>;
  labels: Map<string, string>;
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

function extractLabels(field: FormField): Map<string, string> {
  const labels = new Map<string, string>();
  for (const [locale, translation] of field.translations) {
    labels.set(locale, translation.label);
  }
  return labels;
}

/**
 * テンプレートのフィールド定義に基づいて送信データをバリデーションする。
 * 構造化エラーの配列を返す（空配列 = valid）。
 */
export function validateContactData(
  fields: readonly FormField[],
  data: Readonly<Record<string, unknown>>,
): FieldValidationError[] {
  const errors: FieldValidationError[] = [];

  for (const field of fields) {
    const value = data[field.name];
    const labels = extractLabels(field);

    if (field.isRequired) {
      if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        errors.push({ field: field.name, code: 'required', params: {}, labels });
        continue;
      }
    }

    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (typeof value !== 'string') {
      errors.push({ field: field.name, code: 'invalid_type', params: {}, labels });
      continue;
    }

    if (field.validation.type !== 'none') {
      const validator = formatValidators[field.validation.type];
      if (!validator(value)) {
        errors.push({ field: field.name, code: 'invalid_format', params: { format: field.validation.type }, labels });
      }
    }

    if (field.validation.minLength !== undefined && value.length < field.validation.minLength) {
      errors.push({ field: field.name, code: 'too_short', params: { min: field.validation.minLength }, labels });
    }

    if (field.validation.maxLength !== undefined && value.length > field.validation.maxLength) {
      errors.push({ field: field.name, code: 'too_long', params: { max: field.validation.maxLength }, labels });
    }

    if (field.fieldType === 'select' && field.options.length > 0) {
      const validValues = field.options.map((opt) => opt.value);
      if (!validValues.includes(value)) {
        errors.push({ field: field.name, code: 'invalid_option', params: { options: validValues.join(', ') }, labels });
      }
    }
  }

  return errors;
}
