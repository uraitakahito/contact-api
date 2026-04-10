/**
 * @module kysely-contact-repository
 * @description Driven Adapter（駆動されるアダプター）
 *
 * ContactRepository（Driven Port）の Kysely/PostgreSQL 実装。
 * Domain層のインターフェースを具体的なDB操作に変換する。
 */

import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Contact, ContactStatus, CreateContactInput } from '../domain/contact.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import type { Database } from './database.js';

export class KyselyContactRepository implements ContactRepository {
  private readonly db: Kysely<Database>;

  constructor(db: Kysely<Database>) {
    this.db = db;
  }

  async create(input: CreateContactInput): Promise<Contact> {
    return this.db
      .insertInto('contacts')
      .values({
        lastName: input.lastName,
        firstName: input.firstName,
        email: input.email,
        phone: input.phone ?? null,
        categoryId: input.categoryId,
        message: input.message,
      })
      .returningAll()
      .executeTakeFirstOrThrow() as Promise<Contact>;
  }

  async findAll(filter?: { status?: ContactStatus; ids?: number[] }): Promise<Contact[]> {
    let query = this.db.selectFrom('contacts').selectAll();

    if (filter?.ids !== undefined) {
      if (filter.ids.length === 0) {
        return [];
      }
      query = query.where('id', 'in', filter.ids);
    }

    if (filter?.status !== undefined) {
      query = query.where('status', '=', filter.status);
    }

    return query.orderBy('createdAt', 'desc').execute() as Promise<Contact[]>;
  }

  async findById(id: number): Promise<Contact | undefined> {
    return this.db
      .selectFrom('contacts')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst() as Promise<Contact | undefined>;
  }

  async updateStatus(id: number, status: ContactStatus): Promise<Contact | undefined> {
    return this.db
      .updateTable('contacts')
      .set({ status, updatedAt: sql`now()` })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst() as Promise<Contact | undefined>;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .deleteFrom('contacts')
      .where('id', '=', id)
      .executeTakeFirst();

    return result.numDeletedRows > 0n;
  }
}
