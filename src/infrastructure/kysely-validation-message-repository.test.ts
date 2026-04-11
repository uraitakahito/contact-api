import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Kysely } from 'kysely';
import type { Database } from './database.js';
import { KyselyValidationMessageRepository } from './kysely-validation-message-repository.js';
import { createTestKyselyClient, runMigrations, runSeeds } from '../test-helpers/setup.js';

let kyselyClient: Kysely<Database>;
let repository: KyselyValidationMessageRepository;

beforeAll(async () => {
  kyselyClient = createTestKyselyClient();
  await runMigrations(kyselyClient);
  await runSeeds(kyselyClient);
  repository = new KyselyValidationMessageRepository(kyselyClient);
});

afterAll(async () => {
  await kyselyClient.destroy();
});

describe('KyselyValidationMessageRepository', () => {
  it('should return all validation messages grouped by code and locale', async () => {
    const messages = await repository.findAll();

    expect(messages.size).toBe(6);
    expect(messages.has('required')).toBe(true);
    expect(messages.has('invalid_type')).toBe(true);
    expect(messages.has('invalid_format')).toBe(true);
    expect(messages.has('too_short')).toBe(true);
    expect(messages.has('too_long')).toBe(true);
    expect(messages.has('invalid_option')).toBe(true);
  });

  it('should have ja and en templates for each code', async () => {
    const messages = await repository.findAll();

    for (const [, localeMap] of messages) {
      expect(localeMap.has('ja')).toBe(true);
      expect(localeMap.has('en')).toBe(true);
    }
  });

  it('should return correct template strings', async () => {
    const messages = await repository.findAll();

    expect(messages.get('required')?.get('ja')).toBe('{label}は必須です');
    expect(messages.get('required')?.get('en')).toBe('{label} is required');
    expect(messages.get('invalid_format')?.get('ja')).toBe('{label}の{format}形式が正しくありません');
    expect(messages.get('too_short')?.get('en')).toBe('{label} must be at least {min} characters');
  });
});
