import { describe, expect, it } from 'vitest';
import type { FieldValidationError } from '../domain/form-template.js';
import { ValidationMessageFormatter } from './validation-message-formatter.js';

function createTemplates(): Map<string, Map<string, string>> {
  return new Map([
    ['required', new Map([['ja', '{label}は必須です'], ['en', '{label} is required']])],
    ['invalid_type', new Map([['ja', '{label}は文字列で入力してください'], ['en', '{label} must be a string']])],
    ['invalid_format', new Map([['ja', '{label}の{format}形式が正しくありません'], ['en', '{label} has invalid {format} format']])],
    ['too_short', new Map([['ja', '{label}は{min}文字以上で入力してください'], ['en', '{label} must be at least {min} characters']])],
    ['too_long', new Map([['ja', '{label}は{max}文字以下で入力してください'], ['en', '{label} must be at most {max} characters']])],
    ['invalid_option', new Map([['ja', '{label}は次のいずれかを選択してください: {options}'], ['en', '{label} must be one of: {options}']])],
  ]);
}

function createError(overrides: Partial<FieldValidationError> & { field: string; code: FieldValidationError['code'] }): FieldValidationError {
  return {
    params: {},
    labels: new Map(),
    ...overrides,
  };
}

describe('ValidationMessageFormatter', () => {
  it('should format errors with Japanese locale and labels', () => {
    const formatter = new ValidationMessageFormatter(createTemplates());
    const errors: FieldValidationError[] = [
      createError({
        field: 'email',
        code: 'required',
        labels: new Map([['ja', 'メールアドレス'], ['en', 'Email']]),
      }),
    ];

    const result = formatter.format(errors, 'ja');
    expect(result).toEqual([{ field: 'email', code: 'required', message: 'メールアドレスは必須です' }]);
  });

  it('should format errors with English locale', () => {
    const formatter = new ValidationMessageFormatter(createTemplates());
    const errors: FieldValidationError[] = [
      createError({
        field: 'email',
        code: 'required',
        labels: new Map([['ja', 'メールアドレス'], ['en', 'Email']]),
      }),
    ];

    const result = formatter.format(errors, 'en');
    expect(result).toEqual([{ field: 'email', code: 'required', message: 'Email is required' }]);
  });

  it('should fall back to first available template when locale not found', () => {
    const formatter = new ValidationMessageFormatter(createTemplates());
    const errors: FieldValidationError[] = [
      createError({
        field: 'name',
        code: 'required',
        labels: new Map([['ja', '名前'], ['en', 'Name']]),
      }),
    ];

    const result = formatter.format(errors, 'fr');
    expect(result).toHaveLength(1);
    // Falls back to first available template (ja) and first available label (ja)
    expect(result[0]?.message).toBe('名前は必須です');
  });

  it('should fall back to field:code when no template exists', () => {
    const formatter = new ValidationMessageFormatter(new Map());
    const errors: FieldValidationError[] = [
      createError({ field: 'name', code: 'required' }),
    ];

    const result = formatter.format(errors, 'en');
    expect(result).toEqual([{ field: 'name', code: 'required', message: 'name:required' }]);
  });

  it('should fall back to field name when no labels exist', () => {
    const formatter = new ValidationMessageFormatter(createTemplates());
    const errors: FieldValidationError[] = [
      createError({ field: 'lastName', code: 'required' }),
    ];

    const result = formatter.format(errors, 'en');
    expect(result).toEqual([{ field: 'lastName', code: 'required', message: 'lastName is required' }]);
  });

  it('should interpolate format param for invalid_format', () => {
    const formatter = new ValidationMessageFormatter(createTemplates());
    const errors: FieldValidationError[] = [
      createError({
        field: 'email',
        code: 'invalid_format',
        params: { format: 'email' },
        labels: new Map([['ja', 'メールアドレス']]),
      }),
    ];

    const result = formatter.format(errors, 'ja');
    expect(result[0]?.message).toBe('メールアドレスのemail形式が正しくありません');
  });

  it('should interpolate min param for too_short', () => {
    const formatter = new ValidationMessageFormatter(createTemplates());
    const errors: FieldValidationError[] = [
      createError({
        field: 'code',
        code: 'too_short',
        params: { min: 3 },
        labels: new Map([['en', 'Code']]),
      }),
    ];

    const result = formatter.format(errors, 'en');
    expect(result[0]?.message).toBe('Code must be at least 3 characters');
  });

  it('should interpolate max param for too_long', () => {
    const formatter = new ValidationMessageFormatter(createTemplates());
    const errors: FieldValidationError[] = [
      createError({
        field: 'code',
        code: 'too_long',
        params: { max: 10 },
        labels: new Map([['en', 'Code']]),
      }),
    ];

    const result = formatter.format(errors, 'en');
    expect(result[0]?.message).toBe('Code must be at most 10 characters');
  });

  it('should interpolate options param for invalid_option', () => {
    const formatter = new ValidationMessageFormatter(createTemplates());
    const errors: FieldValidationError[] = [
      createError({
        field: 'category',
        code: 'invalid_option',
        params: { options: 'general, support' },
        labels: new Map([['ja', 'カテゴリ']]),
      }),
    ];

    const result = formatter.format(errors, 'ja');
    expect(result[0]?.message).toBe('カテゴリは次のいずれかを選択してください: general, support');
  });

  it('should format invalid_type error', () => {
    const formatter = new ValidationMessageFormatter(createTemplates());
    const errors: FieldValidationError[] = [
      createError({
        field: 'name',
        code: 'invalid_type',
        labels: new Map([['ja', '名前']]),
      }),
    ];

    const result = formatter.format(errors, 'ja');
    expect(result[0]?.message).toBe('名前は文字列で入力してください');
  });

  it('should format multiple errors', () => {
    const formatter = new ValidationMessageFormatter(createTemplates());
    const errors: FieldValidationError[] = [
      createError({
        field: 'name',
        code: 'required',
        labels: new Map([['en', 'Name']]),
      }),
      createError({
        field: 'email',
        code: 'invalid_format',
        params: { format: 'email' },
        labels: new Map([['en', 'Email']]),
      }),
    ];

    const result = formatter.format(errors, 'en');
    expect(result).toHaveLength(2);
    expect(result[0]?.message).toBe('Name is required');
    expect(result[1]?.message).toBe('Email has invalid email format');
  });
});
