import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { Kysely } from 'kysely';
import type { Database } from './database.js';
import { KyselyContactRepository } from './kysely-contact-repository.js';
import { cleanDatabase, createTestDb, runMigrations } from '../test-helpers/setup.js';

let db: Kysely<Database>;
let repository: KyselyContactRepository;

beforeAll(async () => {
  db = createTestDb();
  await runMigrations(db);
  repository = new KyselyContactRepository(db);
});

afterEach(async () => {
  await cleanDatabase(db);
});

afterAll(async () => {
  await db.destroy();
});

const sampleInput = {
  lastName: 'Test',
  firstName: 'User',
  email: 'test@example.com',
  message: 'Test message body',
};

describe('KyselyContactRepository', () => {
  it('should create a contact', async () => {
    const contact = await repository.create(sampleInput);

    expect(contact.id).toBeDefined();
    expect(contact.lastName).toBe('Test');
    expect(contact.firstName).toBe('User');
    expect(contact.email).toBe('test@example.com');
    expect(contact.phone).toBeNull();
    expect(contact.message).toBe('Test message body');
    expect(contact.status).toBe('new');
    expect(contact.createdAt).toBeInstanceOf(Date);
    expect(contact.updatedAt).toBeInstanceOf(Date);
  });

  it('should create a contact with phone', async () => {
    const contact = await repository.create({ ...sampleInput, phone: '090-1234-5678' });

    expect(contact.phone).toBe('090-1234-5678');
  });

  it('should find all contacts', async () => {
    await repository.create(sampleInput);
    await repository.create({ ...sampleInput, lastName: 'User', firstName: '2' });

    const contacts = await repository.findAll();

    expect(contacts).toHaveLength(2);
  });

  it('should filter contacts by status', async () => {
    await repository.create(sampleInput);
    const contact2 = await repository.create({ ...sampleInput, lastName: 'User', firstName: '2' });
    await repository.update(contact2.id, { status: 'resolved' });

    const resolvedContacts = await repository.findAll({ status: 'resolved' });
    const newContacts = await repository.findAll({ status: 'new' });

    expect(resolvedContacts).toHaveLength(1);
    expect(resolvedContacts[0]?.lastName).toBe('User');
    expect(newContacts).toHaveLength(1);
    expect(newContacts[0]?.lastName).toBe('Test');
  });

  it('should find a contact by id', async () => {
    const created = await repository.create(sampleInput);
    const found = await repository.findById(created.id);

    expect(found).toBeDefined();
    expect(found?.lastName).toBe('Test');
  });

  it('should return undefined for non-existent id', async () => {
    const found = await repository.findById(999);
    expect(found).toBeUndefined();
  });

  it('should update a contact', async () => {
    const created = await repository.create(sampleInput);
    const updated = await repository.update(created.id, {
      lastName: 'Updated',
      status: 'in_progress',
    });

    expect(updated).toBeDefined();
    expect(updated?.lastName).toBe('Updated');
    expect(updated?.status).toBe('in_progress');
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
  });

  it('should return undefined when updating non-existent contact', async () => {
    const result = await repository.update(999, { lastName: 'Updated' });
    expect(result).toBeUndefined();
  });

  it('should delete a contact', async () => {
    const created = await repository.create(sampleInput);
    await expect(repository.delete(created.id)).resolves.toBe(true);

    const found = await repository.findById(created.id);
    expect(found).toBeUndefined();
  });

  it('should return false when deleting non-existent contact', async () => {
    await expect(repository.delete(999)).resolves.toBe(false);
  });
});
