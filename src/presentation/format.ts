/**
 * @module format
 * @description Driving Adapter 補助 — Contact エンティティを JSON レスポンス形式に変換するフォーマッタ。
 */

import type { Contact } from '../domain/contact.js';

export interface ContactResponse {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function formatContact(contact: Contact): ContactResponse {
  return {
    id: contact.id,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    subject: contact.subject,
    message: contact.message,
    status: contact.status,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  };
}

export function formatContacts(contacts: Contact[]): ContactResponse[] {
  return contacts.map(formatContact);
}
