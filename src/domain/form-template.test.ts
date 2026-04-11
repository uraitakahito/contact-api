import { describe, expect, it } from 'vitest';
import { validateContactData } from './form-template.js';
import type { FormField } from './form-template.js';

function createField(overrides: Partial<FormField> & { name: string }): FormField {
  return {
    id: 1,
    fieldType: 'text',
    validation: { type: 'none' },
    isRequired: false,
    displayOrder: 1,
    options: [],
    presentation: {},
    translations: new Map(),
    ...overrides,
  };
}

describe('validateContactData', () => {
  it('should return empty array when all data is valid', () => {
    const fields = [
      createField({ name: 'name', isRequired: true }),
      createField({ name: 'email', validation: { type: 'email' }, isRequired: true }),
    ];
    const data = { name: 'Taro', email: 'taro@example.com' };

    expect(validateContactData(fields, data)).toEqual([]);
  });

  it('should return error for missing required field', () => {
    const fields = [createField({ name: 'name', isRequired: true })];
    const data = {};

    const errors = validateContactData(fields, data);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.field).toBe('name');
    expect(errors[0]?.code).toBe('required');
  });

  it('should return error for empty string on required field', () => {
    const fields = [createField({ name: 'name', isRequired: true })];
    const data = { name: '' };

    expect(validateContactData(fields, data)).toHaveLength(1);
  });

  it('should return error for whitespace-only required field', () => {
    const fields = [createField({ name: 'name', isRequired: true })];
    const data = { name: '   ' };

    expect(validateContactData(fields, data)).toHaveLength(1);
  });

  it('should skip validation for optional field when absent', () => {
    const fields = [createField({ name: 'phone', validation: { type: 'phone' } })];
    const data = {};

    expect(validateContactData(fields, data)).toEqual([]);
  });

  it('should skip validation for optional field when empty string', () => {
    const fields = [createField({ name: 'phone', validation: { type: 'phone' } })];
    const data = { phone: '' };

    expect(validateContactData(fields, data)).toEqual([]);
  });

  it('should validate email format', () => {
    const fields = [createField({ name: 'email', validation: { type: 'email' }, isRequired: true })];

    expect(validateContactData(fields, { email: 'valid@example.com' })).toEqual([]);

    const errors = validateContactData(fields, { email: 'invalid' });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.code).toBe('invalid_format');
    expect(errors[0]?.params).toEqual({ format: 'email' });

    expect(validateContactData(fields, { email: '@missing.com' })).toHaveLength(1);
  });

  it('should validate phone format', () => {
    const fields = [createField({ name: 'phone', validation: { type: 'phone' }, isRequired: true })];

    expect(validateContactData(fields, { phone: '090-1234-5678' })).toEqual([]);
    expect(validateContactData(fields, { phone: '+81 90 1234 5678' })).toEqual([]);
    expect(validateContactData(fields, { phone: 'not-a-phone!' })).toHaveLength(1);
  });

  it('should validate url format', () => {
    const fields = [createField({ name: 'website', validation: { type: 'url' }, isRequired: true })];

    expect(validateContactData(fields, { website: 'https://example.com' })).toEqual([]);
    expect(validateContactData(fields, { website: 'not-a-url' })).toHaveLength(1);
  });

  it('should validate select field options', () => {
    const fields = [createField({
      name: 'category',
      fieldType: 'select',
      isRequired: true,
      options: [
        { value: 'general', labels: new Map([['en', 'General']]) },
        { value: 'support', labels: new Map([['en', 'Support']]) },
      ],
    })];

    expect(validateContactData(fields, { category: 'general' })).toEqual([]);

    const errors = validateContactData(fields, { category: 'invalid' });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.code).toBe('invalid_option');
    expect(errors[0]?.params).toEqual({ options: 'general, support' });
  });

  it('should return error for non-string value', () => {
    const fields = [createField({ name: 'name', isRequired: true })];
    const data = { name: 123 };

    const errors = validateContactData(fields, data);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.code).toBe('invalid_type');
  });

  it('should collect multiple errors', () => {
    const fields = [
      createField({ name: 'name', isRequired: true }),
      createField({ name: 'email', validation: { type: 'email' }, isRequired: true }),
      createField({ name: 'message', isRequired: true }),
    ];
    const data = { email: 'bad' };

    const errors = validateContactData(fields, data);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  it('should return error when value is shorter than minLength', () => {
    const fields = [createField({ name: 'code', validation: { type: 'none', minLength: 3 }, isRequired: true })];

    const errors = validateContactData(fields, { code: 'ab' });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.code).toBe('too_short');
    expect(errors[0]?.params).toEqual({ min: 3 });

    expect(validateContactData(fields, { code: 'abc' })).toEqual([]);
  });

  it('should return error when value exceeds maxLength', () => {
    const fields = [createField({ name: 'code', validation: { type: 'none', maxLength: 5 }, isRequired: true })];

    const errors = validateContactData(fields, { code: 'abcdef' });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.code).toBe('too_long');
    expect(errors[0]?.params).toEqual({ max: 5 });

    expect(validateContactData(fields, { code: 'abcde' })).toEqual([]);
  });

  it('should validate both minLength and maxLength together', () => {
    const fields = [createField({ name: 'pin', validation: { type: 'none', minLength: 4, maxLength: 6 }, isRequired: true })];
    expect(validateContactData(fields, { pin: 'abc' })).toHaveLength(1);
    expect(validateContactData(fields, { pin: 'abcdefg' })).toHaveLength(1);
    expect(validateContactData(fields, { pin: 'abcde' })).toEqual([]);
  });

  it('should skip minLength/maxLength for absent optional field', () => {
    const fields = [createField({ name: 'note', validation: { type: 'none', minLength: 3 } })];
    expect(validateContactData(fields, {})).toEqual([]);
  });

  it('should include field labels from translations', () => {
    const fields = [createField({
      name: 'email',
      isRequired: true,
      translations: new Map([
        ['ja', { label: 'メールアドレス', placeholder: '', helpText: '' }],
        ['en', { label: 'Email', placeholder: '', helpText: '' }],
      ]),
    })];

    const errors = validateContactData(fields, {});
    expect(errors).toHaveLength(1);
    expect(errors[0]?.labels.get('ja')).toBe('メールアドレス');
    expect(errors[0]?.labels.get('en')).toBe('Email');
  });
});
