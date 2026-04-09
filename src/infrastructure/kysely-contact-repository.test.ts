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
  categoryId: 1,
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
    expect(contact.categoryId).toBe(1);
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
    await repository.updateStatus(contact2.id, 'resolved');

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

  it('should update status', async () => {
    const created = await repository.create(sampleInput);
    const updated = await repository.updateStatus(created.id, 'in_progress');

    expect(updated).toBeDefined();
    expect(updated?.status).toBe('in_progress');
    expect(updated?.lastName).toBe('Test');
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
  });

  it('should return undefined when updating status of non-existent contact', async () => {
    const result = await repository.updateStatus(999, 'in_progress');
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
