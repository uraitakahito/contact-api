/**
 * @module kysely-contact-repository
 * @description Driven Adapter（駆動されるアダプター）
 *
 * ContactRepository（Driven Port）の Kysely/PostgreSQL 実装。
 * Domain層のインターフェースを具体的なDB操作に変換する。
 */

import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Contact, ContactStatus, CreateContactInput, UpdateContactInput } from '../domain/contact.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import type { Database } from './database.js';

export class KyselyContactRepository implements ContactRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async create(input: CreateContactInput): Promise<Contact> {
    return this.db
      .insertInto('contacts')
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        subject: input.subject,
        message: input.message,
      })
      .returningAll()
      .executeTakeFirstOrThrow() as Promise<Contact>;
  }

  async findAll(filter?: { status?: ContactStatus }): Promise<Contact[]> {
    let query = this.db.selectFrom('contacts').selectAll();

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

  async update(id: number, input: UpdateContactInput): Promise<Contact | undefined> {
    const values: Record<string, unknown> = {};

    if (input.name !== undefined) {
      values['name'] = input.name;
    }
    if (input.email !== undefined) {
      values['email'] = input.email;
    }
    if (input.phone !== undefined) {
      values['phone'] = input.phone;
    }
    if (input.subject !== undefined) {
      values['subject'] = input.subject;
    }
    if (input.message !== undefined) {
      values['message'] = input.message;
    }
    if (input.status !== undefined) {
      values['status'] = input.status;
    }

    if (Object.keys(values).length === 0) {
      return this.findById(id);
    }

    values['updatedAt'] = sql`now()`;

    return this.db
      .updateTable('contacts')
      .set(values)
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
