/**
 * @module format
 * @description Driving Adapter 補助 — エンティティを JSON レスポンス形式に変換するフォーマッタ。
 */

import type { ContactCategory } from '../domain/contact-category.js';
import type { Contact } from '../domain/contact.js';

export interface ContactResponse {
  id: number;
  lastName: string;
  firstName: string;
  email: string;
  phone: string | null;
  categoryId: number;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function formatContact(contact: Contact): ContactResponse {
  return {
    id: contact.id,
    lastName: contact.lastName,
    firstName: contact.firstName,
    email: contact.email,
    phone: contact.phone,
    categoryId: contact.categoryId,
    message: contact.message,
    status: contact.status,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  };
}

export function formatContacts(contacts: Contact[]): ContactResponse[] {
  return contacts.map(formatContact);
}

export interface ContactCategoryResponse {
  id: number;
  name: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function formatContactCategory(
  category: ContactCategory,
  locale: string,
): ContactCategoryResponse {
  const name = category.translations.get(locale)
    ?? category.translations.values().next().value
    ?? '';
  return {
    id: category.id,
    name,
    displayOrder: category.displayOrder,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export function formatContactCategories(
  categories: ContactCategory[],
  locale: string,
): ContactCategoryResponse[] {
  return categories.map((c) => formatContactCategory(c, locale));
}
