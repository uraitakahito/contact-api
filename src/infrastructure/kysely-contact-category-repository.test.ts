import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Kysely } from 'kysely';
import type { Database } from './database.js';
import { KyselyContactCategoryRepository } from './kysely-contact-category-repository.js';
import { createTestDb, runMigrations } from '../test-helpers/setup.js';

let db: Kysely<Database>;
let repository: KyselyContactCategoryRepository;

beforeAll(async () => {
  db = createTestDb();
  await runMigrations(db);
  repository = new KyselyContactCategoryRepository(db);
});

afterAll(async () => {
  await db.destroy();
});

describe('KyselyContactCategoryRepository', () => {
  it('should return all categories ordered by displayOrder', async () => {
    const categories = await repository.findAll();

    expect(categories).toHaveLength(4);
    expect(categories[0]?.name).toBe('一般的なお問合せ');
    expect(categories[1]?.name).toBe('製品/サービスについて');
    expect(categories[2]?.name).toBe('採用について');
    expect(categories[3]?.name).toBe('その他');
  });

  it('should find a category by id', async () => {
    const category = await repository.findById(1);

    expect(category).toBeDefined();
    expect(category?.name).toBe('一般的なお問合せ');
    expect(category?.displayOrder).toBe(1);
    expect(category?.createdAt).toBeInstanceOf(Date);
  });

  it('should return undefined for non-existent id', async () => {
    const category = await repository.findById(999);
    expect(category).toBeUndefined();
  });
});
