import { describe, expect, it } from 'vitest';
import { validateContactData } from './form-template.js';
import type { FormField } from './form-template.js';

function createField(overrides: Partial<FormField> & { name: string }): FormField {
  return {
    id: 1,
    fieldType: 'text',
    validationType: 'none',
    isRequired: false,
    displayOrder: 1,
    options: [],
    translations: new Map(),
    ...overrides,
  };
}

describe('validateContactData', () => {
  it('should return empty array when all data is valid', () => {
    const fields = [
      createField({ name: 'name', isRequired: true }),
      createField({ name: 'email', validationType: 'email', isRequired: true }),
    ];
    const data = { name: 'Taro', email: 'taro@example.com' };

    expect(validateContactData(fields, data)).toEqual([]);
  });

  it('should return error for missing required field', () => {
    const fields = [createField({ name: 'name', isRequired: true })];
    const data = {};

    const errors = validateContactData(fields, data);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("'name'");
    expect(errors[0]).toContain('required');
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
    const fields = [createField({ name: 'phone', validationType: 'phone' })];
    const data = {};

    expect(validateContactData(fields, data)).toEqual([]);
  });

  it('should skip validation for optional field when empty string', () => {
    const fields = [createField({ name: 'phone', validationType: 'phone' })];
    const data = { phone: '' };

    expect(validateContactData(fields, data)).toEqual([]);
  });

  it('should validate email format', () => {
    const fields = [createField({ name: 'email', validationType: 'email', isRequired: true })];

    expect(validateContactData(fields, { email: 'valid@example.com' })).toEqual([]);
    expect(validateContactData(fields, { email: 'invalid' })).toHaveLength(1);
    expect(validateContactData(fields, { email: '@missing.com' })).toHaveLength(1);
  });

  it('should validate phone format', () => {
    const fields = [createField({ name: 'phone', validationType: 'phone', isRequired: true })];

    expect(validateContactData(fields, { phone: '090-1234-5678' })).toEqual([]);
    expect(validateContactData(fields, { phone: '+81 90 1234 5678' })).toEqual([]);
    expect(validateContactData(fields, { phone: 'not-a-phone!' })).toHaveLength(1);
  });

  it('should validate url format', () => {
    const fields = [createField({ name: 'website', validationType: 'url', isRequired: true })];

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
    expect(validateContactData(fields, { category: 'invalid' })).toHaveLength(1);
  });

  it('should return error for non-string value', () => {
    const fields = [createField({ name: 'name', isRequired: true })];
    const data = { name: 123 };

    const errors = validateContactData(fields, data);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('must be a string');
  });

  it('should collect multiple errors', () => {
    const fields = [
      createField({ name: 'name', isRequired: true }),
      createField({ name: 'email', validationType: 'email', isRequired: true }),
      createField({ name: 'message', isRequired: true }),
    ];
    const data = { email: 'bad' };

    const errors = validateContactData(fields, data);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});
