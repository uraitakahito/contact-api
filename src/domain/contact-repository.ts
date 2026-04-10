/**
 * @module contact-repository
 * @description Driven Port — Repository インターフェース。
 *
 * Domain 層が「永続化に何を求めるか」を定義するインターフェース。
 * 具体的な保存方法（RDB, NoSQL, ファイル等）には一切依存しない。
 *
 * @see {@link file://../infrastructure/kysely-contact-repository.ts} Driven Adapter（Kysely 実装）
 */

import type { ContactStatus, CreateContactInput, Contact } from './contact.js';

export interface ContactRepository {
  create(userId: string, input: CreateContactInput): Promise<Contact>;
  findAll(filter?: { status?: ContactStatus; ids?: number[]; templateId?: number }): Promise<Contact[]>;
  findById(id: number): Promise<Contact | undefined>;
  updateStatus(id: number, status: ContactStatus): Promise<Contact | undefined>;
  delete(id: number): Promise<boolean>;
}
