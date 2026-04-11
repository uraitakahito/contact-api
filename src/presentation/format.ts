/**
 * @module format
 * @description Driving Adapter 補助 — エンティティを JSON レスポンス形式に変換するフォーマッタ。
 */

import type { Contact } from '../domain/contact.js';
import type { FormTemplate, FormField, FormFieldOption, FieldTranslation, FieldValidation } from '../domain/form-template.js';

// --- Contact ---

export interface ContactResponse {
  id: number;
  templateId: number;
  userId: string;
  data: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function formatContact(contact: Contact): ContactResponse {
  return {
    id: contact.id,
    templateId: contact.templateId,
    userId: contact.userId,
    data: contact.data,
    status: contact.status,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  };
}

export function formatContacts(contacts: Contact[]): ContactResponse[] {
  return contacts.map(formatContact);
}

// --- Form Template ---

export interface FormFieldOptionResponse {
  value: string;
  labels: Record<string, string>;
}

export interface FormFieldResponse {
  id: number;
  name: string;
  fieldType: string;
  validation: FieldValidation;
  isRequired: boolean;
  displayOrder: number;
  label: string;
  placeholder: string;
  helpText: string;
  options: FormFieldOptionResponse[];
  cssClass: string;
  htmlId: string;
}

export interface FormTemplateResponse {
  id: number;
  name: string;
  displayName: string;
  fields: FormFieldResponse[];
  createdAt: string;
  updatedAt: string;
}

function formatFieldOption(option: FormFieldOption): FormFieldOptionResponse {
  return {
    value: option.value,
    labels: Object.fromEntries(option.labels),
  };
}

function resolveFieldTranslation(
  translations: Map<string, FieldTranslation>,
  locale: string,
): FieldTranslation {
  const exact = translations.get(locale);
  if (exact) return exact;
  const fallback = translations.values().next().value;
  return fallback ?? { label: '', placeholder: '', helpText: '' };
}

function formatField(field: FormField, locale: string): FormFieldResponse {
  const trans = resolveFieldTranslation(field.translations, locale);
  return {
    id: field.id,
    name: field.name,
    fieldType: field.fieldType,
    validation: field.validation,
    isRequired: field.isRequired,
    displayOrder: field.displayOrder,
    label: trans.label,
    placeholder: trans.placeholder,
    helpText: trans.helpText,
    options: field.options.map((opt) => formatFieldOption(opt)),
    cssClass: field.cssClass,
    htmlId: field.htmlId,
  };
}

export function formatFormTemplate(template: FormTemplate, locale: string): FormTemplateResponse {
  const displayName = template.translations.get(locale)
    ?? template.translations.values().next().value
    ?? template.name;
  return {
    id: template.id,
    name: template.name,
    displayName,
    fields: template.fields.map((f) => formatField(f, locale)),
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

export function formatFormTemplates(templates: FormTemplate[], locale: string): FormTemplateResponse[] {
  return templates.map((t) => formatFormTemplate(t, locale));
}
