import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { Kysely } from 'kysely';
import type { Database } from './database.js';
import type { CreateContactInput } from '../domain/contact.js';
import { KyselyContactRepository } from './kysely-contact-repository.js';
import { cleanDatabase, createTestDb, runMigrations, runSeeds } from '../test-helpers/setup.js';

let db: Kysely<Database>;
let repository: KyselyContactRepository;

const sampleInput: CreateContactInput = {
  templateId: 1,
  data: { lastName: 'Test', firstName: 'User', email: 'test@example.com', message: 'Hello' },
};

beforeAll(async () => {
  db = createTestDb();
  await runMigrations(db);
  await runSeeds(db);
  repository = new KyselyContactRepository(db);
});

afterEach(async () => {
  await cleanDatabase(db);
});

afterAll(async () => {
  await db.destroy();
});

describe('KyselyContactRepository', () => {
  describe('create', () => {
    it('should insert a contact and return it', async () => {
      const contact = await repository.create('test-user', sampleInput);

      expect(contact.id).toBeDefined();
      expect(contact.templateId).toBe(1);
      expect(contact.userId).toBe('test-user');
      expect(contact.data).toEqual(sampleInput.data);
      expect(contact.status).toBe('new');
      expect(contact.createdAt).toBeInstanceOf(Date);
      expect(contact.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findAll', () => {
    it('should return all contacts', async () => {
      await repository.create('user1', sampleInput);
      await repository.create('user2', sampleInput);

      const contacts = await repository.findAll();

      expect(contacts).toHaveLength(2);
    });

    it('should filter by ids', async () => {
      const c1 = await repository.create('user1', sampleInput);
      await repository.create('user2', sampleInput);

      const contacts = await repository.findAll({ ids: [c1.id] });

      expect(contacts).toHaveLength(1);
      expect(contacts[0]!.id).toBe(c1.id);
    });

    it('should return empty array for empty ids', async () => {
      await repository.create('user1', sampleInput);

      const contacts = await repository.findAll({ ids: [] });

      expect(contacts).toHaveLength(0);
    });

    it('should filter by status', async () => {
      const c1 = await repository.create('user1', sampleInput);
      await repository.updateStatus(c1.id, 'in_progress');

      const contacts = await repository.findAll({ status: 'in_progress' });

      expect(contacts).toHaveLength(1);
    });

    it('should filter by templateId', async () => {
      await repository.create('user1', sampleInput);
      await repository.create('user2', { templateId: 2, data: { name: 'Test', email: 'a@b.com', message: 'Hi' } });

      const contacts = await repository.findAll({ templateId: 1 });

      expect(contacts).toHaveLength(1);
      expect(contacts[0]!.templateId).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return a contact by id', async () => {
      const created = await repository.create('test-user', sampleInput);

      const found = await repository.findById(created.id);

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.data).toEqual(sampleInput.data);
    });

    it('should return undefined for non-existent id', async () => {
      const found = await repository.findById(99999);

      expect(found).toBeUndefined();
    });
  });

  describe('updateStatus', () => {
    it('should update the status and return the updated contact', async () => {
      const created = await repository.create('test-user', sampleInput);

      const updated = await repository.updateStatus(created.id, 'in_progress');

      expect(updated).toBeDefined();
      expect(updated!.status).toBe('in_progress');
    });

    it('should return undefined for non-existent id', async () => {
      const updated = await repository.updateStatus(99999, 'in_progress');

      expect(updated).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete a contact and return true', async () => {
      const created = await repository.create('test-user', sampleInput);

      const result = await repository.delete(created.id);

      expect(result).toBe(true);
      expect(await repository.findById(created.id)).toBeUndefined();
    });

    it('should return false for non-existent id', async () => {
      const result = await repository.delete(99999);

      expect(result).toBe(false);
    });
  });
});
