import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database } from './database.js';
import type { CreateFormTemplateInput } from '../domain/form-template.js';
import { KyselyFormTemplateRepository } from './kysely-form-template-repository.js';
import { createTestKyselyClient, runMigrations, runSeeds } from '../test-helpers/setup.js';

let kyselyClient: Kysely<Database>;
let repository: KyselyFormTemplateRepository;

const sampleInput: CreateFormTemplateInput = {
  name: 'test-form',
  translations: new Map([
    ['ja', 'テストフォーム'],
    ['en', 'Test Form'],
  ]),
  fields: [
    {
      name: 'name',
      fieldType: 'text',
      validation: { type: 'none' },
      isRequired: true,
      displayOrder: 1,
      options: [],
      cssClass: 'form-control',
      htmlId: 'field-name',
      translations: new Map([
        ['ja', { label: '名前', placeholder: '', helpText: '' }],
        ['en', { label: 'Name', placeholder: '', helpText: '' }],
      ]),
    },
    {
      name: 'email',
      fieldType: 'text',
      validation: { type: 'email' },
      isRequired: true,
      displayOrder: 2,
      options: [],
      cssClass: 'form-control',
      htmlId: 'field-email',
      translations: new Map([
        ['ja', { label: 'メール', placeholder: '', helpText: '' }],
        ['en', { label: 'Email', placeholder: '', helpText: '' }],
      ]),
    },
  ],
};

beforeAll(async () => {
  kyselyClient = createTestKyselyClient();
  await runMigrations(kyselyClient);
  await runSeeds(kyselyClient);
  repository = new KyselyFormTemplateRepository(kyselyClient);
});

afterEach(async () => {
  // Clean up only test-created templates (keep seeds: id 1, 2)
  await sql`DELETE FROM form_templates WHERE id > 2`.execute(kyselyClient);
});

afterAll(async () => {
  await kyselyClient.destroy();
});

describe('KyselyFormTemplateRepository', () => {
  describe('findAll', () => {
    it('should return seeded templates with fields', async () => {
      const templates = await repository.findAll();

      expect(templates.length).toBeGreaterThanOrEqual(2);
      const contactForm = templates.find((t) => t.name === 'contact-form');
      expect(contactForm).toBeDefined();
      expect(contactForm!.fields.length).toBe(6);
      expect(contactForm!.translations.get('ja')).toBe('問い合わせフォーム');
    });
  });

  describe('findById', () => {
    it('should return a template with fields and translations', async () => {
      const template = await repository.findById(1);

      expect(template).toBeDefined();
      expect(template!.name).toBe('contact-form');
      expect(template!.fields.length).toBe(6);
      expect(template!.fields[0]!.translations.get('ja')?.label).toBe('姓');
    });

    it('should return undefined for non-existent id', async () => {
      expect(await repository.findById(99999)).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create a template with fields and translations', async () => {
      const created = await repository.create(sampleInput);

      expect(created.id).toBeDefined();
      expect(created.name).toBe('test-form');
      expect(created.translations.get('ja')).toBe('テストフォーム');
      expect(created.fields).toHaveLength(2);
      expect(created.fields[0]!.name).toBe('name');
      expect(created.fields[1]!.validation.type).toBe('email');

      // Verify persistence
      const found = await repository.findById(created.id);
      expect(found).toBeDefined();
      expect(found!.fields).toHaveLength(2);
    });

    it('should create a template with select field options', async () => {
      const input: CreateFormTemplateInput = {
        name: 'with-select',
        translations: new Map([['en', 'With Select']]),
        fields: [{
          name: 'color',
          fieldType: 'select',
          validation: { type: 'none' },
          isRequired: true,
          displayOrder: 1,
          options: [
            { value: 'red', labels: new Map([['en', 'Red'], ['ja', '赤']]) },
            { value: 'blue', labels: new Map([['en', 'Blue'], ['ja', '青']]) },
          ],
          cssClass: 'form-control',
          htmlId: 'field-color',
          translations: new Map([['en', { label: 'Color', placeholder: '', helpText: '' }]]),
        }],
      };

      const created = await repository.create(input);
      const found = await repository.findById(created.id);

      expect(found!.fields[0]!.options).toHaveLength(2);
      expect(found!.fields[0]!.options[0]!.value).toBe('red');
      expect(found!.fields[0]!.options[0]!.labels.get('ja')).toBe('赤');
    });

    it('should persist validation with minLength/maxLength', async () => {
      const input: CreateFormTemplateInput = {
        name: 'validated-form',
        translations: new Map([['en', 'Validated']]),
        fields: [{
          name: 'bio',
          fieldType: 'textarea',
          validation: { type: 'none', minLength: 10, maxLength: 500 },
          isRequired: true,
          displayOrder: 1,
          options: [],
          cssClass: 'input-lg',
          htmlId: 'bio-field',
          translations: new Map([['en', { label: 'Bio', placeholder: 'Tell us about yourself', helpText: 'At least 10 characters' }]]),
        }],
      };

      const created = await repository.create(input);
      const found = await repository.findById(created.id);

      expect(found!.fields[0]!.validation).toEqual({ type: 'none', minLength: 10, maxLength: 500 });
      expect(found!.fields[0]!.cssClass).toBe('input-lg');
      expect(found!.fields[0]!.htmlId).toBe('bio-field');
      expect(found!.fields[0]!.translations.get('en')?.helpText).toBe('At least 10 characters');
    });
  });

  describe('update', () => {
    it('should update template name and translations', async () => {
      const created = await repository.create(sampleInput);

      const updated = await repository.update(created.id, {
        name: 'updated-form',
        translations: new Map([['en', 'Updated Form']]),
      });

      expect(updated).toBeDefined();
      expect(updated!.name).toBe('updated-form');
      expect(updated!.translations.get('en')).toBe('Updated Form');
      expect(updated!.translations.has('ja')).toBe(false);
    });

    it('should replace fields when provided', async () => {
      const created = await repository.create(sampleInput);

      const updated = await repository.update(created.id, {
        fields: [{
          name: 'message',
          fieldType: 'textarea',
          validation: { type: 'none' },
          isRequired: true,
          displayOrder: 1,
          options: [],
          cssClass: 'form-control',
          htmlId: 'field-message',
          translations: new Map(),
        }],
      });

      expect(updated!.fields).toHaveLength(1);
      expect(updated!.fields[0]!.name).toBe('message');
    });

    it('should return undefined for non-existent id', async () => {
      expect(await repository.update(99999, { name: 'x' })).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete a template and return true', async () => {
      const created = await repository.create(sampleInput);

      expect(await repository.delete(created.id)).toBe(true);
      expect(await repository.findById(created.id)).toBeUndefined();
    });

    it('should return false for non-existent id', async () => {
      expect(await repository.delete(99999)).toBe(false);
    });
  });
});
