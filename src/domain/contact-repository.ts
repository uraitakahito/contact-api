/**
 * @module contact-repository
 * @description Driven Port（駆動されるポート） — Repository インターフェース。
 *
 * Domain 層が「永続化に何を求めるか」を定義するインターフェース。
 * 具体的な保存方法（RDB, NoSQL, ファイル等）には一切依存しない。
 *
 * DDD では Repository の **インターフェース** は Domain 層に属し、
 * その **実装** は Infrastructure 層に属する（依存性逆転の原則）。
 * これにより Application 層・Domain 層は具体的な DB 技術を知らず、
 * Infrastructure 層の Adapter を差し替えるだけで技術を変更できる。
 *
 * @see {@link file://../infrastructure/kysely-contact-repository.ts} Driven Adapter（Kysely 実装）
 */

import type { ContactStatus, CreateContactInput, Contact } from './contact.js';

export interface ContactRepository {
  create(input: CreateContactInput): Promise<Contact>;
  findAll(filter?: { status?: ContactStatus; ids?: number[] }): Promise<Contact[]>;
  findById(id: number): Promise<Contact | undefined>;
  updateStatus(id: number, status: ContactStatus): Promise<Contact | undefined>;
  delete(id: number): Promise<boolean>;
}
