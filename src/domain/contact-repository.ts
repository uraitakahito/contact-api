/**
 * @module contact-repository
 * @description Driven Port（駆動されるポート）
 *
 * アプリケーションが外部（データベース）とやり取りするための
 * インターフェース定義。Domain層に属し、具体的な実装技術に
 * 依存しない。
 */

import type { ContactStatus, CreateContactInput, Contact, UpdateContactInput } from './contact.js';

export interface ContactRepository {
  create(input: CreateContactInput): Promise<Contact>;
  findAll(filter?: { status?: ContactStatus }): Promise<Contact[]>;
  findById(id: number): Promise<Contact | undefined>;
  update(id: number, input: UpdateContactInput): Promise<Contact | undefined>;
  delete(id: number): Promise<boolean>;
}
