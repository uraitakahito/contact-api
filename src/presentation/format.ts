/**
 * @module format
 * @description Driving Adapter 補助 — Contact エンティティを JSON レスポンス形式に変換するフォーマッタ。
 */

import type { Contact } from '../domain/contact.js';

export interface ContactResponse {
  id: number;
  lastName: string;
  firstName: string;
  email: string;
  phone: string | null;
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
    message: contact.message,
    status: contact.status,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  };
}

export function formatContacts(contacts: Contact[]): ContactResponse[] {
  return contacts.map(formatContact);
}
