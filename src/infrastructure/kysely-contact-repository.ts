/**
 * @module kysely-contact-repository
 * @description Driven Adapter
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

  async create(userId: string, input: CreateContactInput): Promise<Contact> {
    const row = await this.db
      .insertInto('contacts')
      .values({
        templateId: input.templateId,
        userId,
        data: JSON.stringify(input.data),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toContact(row);
  }

  async findAll(filter?: { status?: ContactStatus; ids?: number[]; templateId?: number }): Promise<Contact[]> {
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

    if (filter?.templateId !== undefined) {
      query = query.where('templateId', '=', filter.templateId);
    }

    const rows = await query.orderBy('createdAt', 'desc').execute();
    return rows.map(toContact);
  }

  async findById(id: number): Promise<Contact | undefined> {
    const row = await this.db
      .selectFrom('contacts')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? toContact(row) : undefined;
  }

  async updateStatus(id: number, status: ContactStatus): Promise<Contact | undefined> {
    const row = await this.db
      .updateTable('contacts')
      .set({ status, updatedAt: sql`now()` })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return row ? toContact(row) : undefined;
  }

  async delete(id: number): Promise<boolean> {
    const { numDeletedRows } = await this.db
      .deleteFrom('contacts')
      .where('id', '=', id)
      .executeTakeFirst();

    return numDeletedRows > 0n;
  }
}

function toContact(row: {
  id: number;
  templateId: number;
  userId: string;
  data: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): Contact {
  return {
    id: row.id,
    templateId: row.templateId,
    userId: row.userId,
    data: row.data as Record<string, unknown>,
    status: row.status as Contact['status'],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
