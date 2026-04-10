/**
 * @module kysely-form-template-repository
 * @description Driven Adapter（駆動されるアダプター）
 *
 * FormTemplateRepository（Driven Port）の Kysely/PostgreSQL 実装。
 * Domain層のインターフェースを具体的なDB操作に変換する。
 *
 * @see {@link file://../domain/form-template-repository.ts} Driven Port（インターフェース）
 */

import type { Kysely } from 'kysely';
import type { FormTemplateRepository } from '../domain/form-template-repository.js';
import type {
  CreateFormFieldInput,
  CreateFormTemplateInput,
  FieldPresentation,
  FieldTranslation,
  FieldValidation,
  FormField,
  FormFieldOption,
  FormTemplate,
  UpdateFormTemplateInput,
  ValidationType,
} from '../domain/form-template.js';
import type { Database } from './database.js';

// --- Row types for JOIN queries ---

interface TemplateRow {
  templateId: number;
  templateName: string;
  templateCreatedAt: Date;
  templateUpdatedAt: Date;
  templateTransLocale: string | null;
  templateTransName: string | null;
}

interface FieldRow {
  fieldId: number;
  fieldName: string;
  fieldType: string;
  validation: unknown;
  isRequired: boolean;
  displayOrder: number;
  options: unknown;
  presentation: unknown;
  fieldTransLocale: string | null;
  fieldTransLabel: string | null;
  fieldTransPlaceholder: string | null;
  fieldTransHelpText: string | null;
}

// --- JSON shape for form_fields.options column ---

interface OptionJson {
  value: string;
  labels: Record<string, string>;
}

function parseOptions(raw: unknown): FormFieldOption[] {
  if (!Array.isArray(raw)) return [];
  return (raw as OptionJson[]).map((opt) => ({
    value: opt.value,
    labels: new Map(Object.entries(opt.labels)),
  }));
}

function serializeOptions(options: FormFieldOption[]): OptionJson[] {
  return options.map((opt) => ({
    value: opt.value,
    labels: Object.fromEntries(opt.labels),
  }));
}

// --- Validation / Presentation JSON helpers ---

interface ValidationJson {
  type: string;
  minLength?: number;
  maxLength?: number;
}

interface PresentationJson {
  cssClass?: string;
  htmlId?: string;
}

function parseValidation(raw: unknown): FieldValidation {
  if (raw !== null && typeof raw === 'object' && 'type' in raw) {
    const obj = raw as ValidationJson;
    return {
      type: obj.type as ValidationType,
      ...(obj.minLength !== undefined ? { minLength: obj.minLength } : {}),
      ...(obj.maxLength !== undefined ? { maxLength: obj.maxLength } : {}),
    };
  }
  return { type: 'none' };
}

function parsePresentation(raw: unknown): FieldPresentation {
  if (raw !== null && typeof raw === 'object') {
    const obj = raw as PresentationJson;
    return {
      ...(obj.cssClass !== undefined ? { cssClass: obj.cssClass } : {}),
      ...(obj.htmlId !== undefined ? { htmlId: obj.htmlId } : {}),
    };
  }
  return {};
}

// --- Grouping helpers ---

function groupFields(rows: FieldRow[]): FormField[] {
  const map = new Map<number, FormField>();

  for (const row of rows) {
    let field = map.get(row.fieldId);
    if (!field) {
      field = {
        id: row.fieldId,
        name: row.fieldName,
        fieldType: row.fieldType as FormField['fieldType'],
        validation: parseValidation(row.validation),
        isRequired: row.isRequired,
        displayOrder: row.displayOrder,
        options: parseOptions(row.options),
        presentation: parsePresentation(row.presentation),
        translations: new Map<string, FieldTranslation>(),
      };
      map.set(row.fieldId, field);
    }
    if (row.fieldTransLocale !== null && row.fieldTransLabel !== null) {
      field.translations.set(row.fieldTransLocale, {
        label: row.fieldTransLabel,
        placeholder: row.fieldTransPlaceholder ?? '',
        helpText: row.fieldTransHelpText ?? '',
      });
    }
  }

  return [...map.values()].sort((a, b) => a.displayOrder - b.displayOrder);
}

export class KyselyFormTemplateRepository implements FormTemplateRepository {
  private readonly db: Kysely<Database>;

  constructor(db: Kysely<Database>) {
    this.db = db;
  }

  async findAll(): Promise<FormTemplate[]> {
    // Step 1: Fetch templates with translations
    const templateRows = await this.db
      .selectFrom('formTemplates')
      .leftJoin('formTemplateTranslations', 'formTemplates.id', 'formTemplateTranslations.templateId')
      .select([
        'formTemplates.id as templateId',
        'formTemplates.name as templateName',
        'formTemplates.createdAt as templateCreatedAt',
        'formTemplates.updatedAt as templateUpdatedAt',
        'formTemplateTranslations.locale as templateTransLocale',
        'formTemplateTranslations.name as templateTransName',
      ])
      .orderBy('formTemplates.id', 'asc')
      .execute() as TemplateRow[];

    const templateMap = new Map<number, FormTemplate>();
    for (const row of templateRows) {
      let template = templateMap.get(row.templateId);
      if (!template) {
        template = {
          id: row.templateId,
          name: row.templateName,
          translations: new Map<string, string>(),
          fields: [],
          createdAt: row.templateCreatedAt,
          updatedAt: row.templateUpdatedAt,
        };
        templateMap.set(row.templateId, template);
      }
      if (row.templateTransLocale !== null && row.templateTransName !== null) {
        template.translations.set(row.templateTransLocale, row.templateTransName);
      }
    }

    if (templateMap.size === 0) return [];

    // Step 2: Fetch all fields with translations for these templates
    const templateIds = [...templateMap.keys()];
    const fieldRows = await this.db
      .selectFrom('formFields')
      .leftJoin('formFieldTranslations', 'formFields.id', 'formFieldTranslations.fieldId')
      .select([
        'formFields.id as fieldId',
        'formFields.templateId',
        'formFields.name as fieldName',
        'formFields.fieldType',
        'formFields.validation',
        'formFields.isRequired',
        'formFields.displayOrder',
        'formFields.options',
        'formFields.presentation',
        'formFieldTranslations.locale as fieldTransLocale',
        'formFieldTranslations.label as fieldTransLabel',
        'formFieldTranslations.placeholder as fieldTransPlaceholder',
        'formFieldTranslations.helpText as fieldTransHelpText',
      ])
      .where('formFields.templateId', 'in', templateIds)
      .orderBy('formFields.displayOrder', 'asc')
      .execute();

    // Group fields by templateId
    const fieldsByTemplate = new Map<number, FieldRow[]>();
    for (const row of fieldRows) {
      const tid = row.templateId;
      let arr = fieldsByTemplate.get(tid);
      if (!arr) {
        arr = [];
        fieldsByTemplate.set(tid, arr);
      }
      arr.push(row as unknown as FieldRow);
    }

    for (const [tid, rows] of fieldsByTemplate) {
      const template = templateMap.get(tid);
      if (template) {
        template.fields = groupFields(rows);
      }
    }

    return [...templateMap.values()];
  }

  async findById(id: number): Promise<FormTemplate | undefined> {
    // Step 1: Fetch template with translations
    const templateRows = await this.db
      .selectFrom('formTemplates')
      .leftJoin('formTemplateTranslations', 'formTemplates.id', 'formTemplateTranslations.templateId')
      .select([
        'formTemplates.id as templateId',
        'formTemplates.name as templateName',
        'formTemplates.createdAt as templateCreatedAt',
        'formTemplates.updatedAt as templateUpdatedAt',
        'formTemplateTranslations.locale as templateTransLocale',
        'formTemplateTranslations.name as templateTransName',
      ])
      .where('formTemplates.id', '=', id)
      .execute() as TemplateRow[];

    const firstRow = templateRows[0];
    if (!firstRow) return undefined;
    const template: FormTemplate = {
      id: firstRow.templateId,
      name: firstRow.templateName,
      translations: new Map<string, string>(),
      fields: [],
      createdAt: firstRow.templateCreatedAt,
      updatedAt: firstRow.templateUpdatedAt,
    };

    for (const row of templateRows) {
      if (row.templateTransLocale !== null && row.templateTransName !== null) {
        template.translations.set(row.templateTransLocale, row.templateTransName);
      }
    }

    // Step 2: Fetch fields with translations
    const fieldRows = await this.db
      .selectFrom('formFields')
      .leftJoin('formFieldTranslations', 'formFields.id', 'formFieldTranslations.fieldId')
      .select([
        'formFields.id as fieldId',
        'formFields.name as fieldName',
        'formFields.fieldType',
        'formFields.validation',
        'formFields.isRequired',
        'formFields.displayOrder',
        'formFields.options',
        'formFields.presentation',
        'formFieldTranslations.locale as fieldTransLocale',
        'formFieldTranslations.label as fieldTransLabel',
        'formFieldTranslations.placeholder as fieldTransPlaceholder',
        'formFieldTranslations.helpText as fieldTransHelpText',
      ])
      .where('formFields.templateId', '=', id)
      .orderBy('formFields.displayOrder', 'asc')
      .execute() as FieldRow[];

    template.fields = groupFields(fieldRows);

    return template;
  }

  async create(input: CreateFormTemplateInput): Promise<FormTemplate> {
    return this.db.transaction().execute(async (trx) => {
      const templateRow = await trx
        .insertInto('formTemplates')
        .values({ name: input.name })
        .returningAll()
        .executeTakeFirstOrThrow();

      const templateId = templateRow.id;

      // Insert template translations
      const transEntries = [...input.translations.entries()];
      if (transEntries.length > 0) {
        await trx
          .insertInto('formTemplateTranslations')
          .values(transEntries.map(([locale, name]) => ({ templateId, locale, name })))
          .execute();
      }

      // Insert fields and field translations
      const fields = await this.insertFields(trx, templateId, input.fields);

      return {
        id: templateId,
        name: input.name,
        translations: new Map(transEntries),
        fields,
        createdAt: templateRow.createdAt,
        updatedAt: templateRow.updatedAt,
      };
    });
  }

  async update(id: number, input: UpdateFormTemplateInput): Promise<FormTemplate | undefined> {
    const updateResult = await this.db.transaction().execute(async (trx) => {
      // Check existence
      const existing = await trx
        .selectFrom('formTemplates')
        .select('id')
        .where('id', '=', id)
        .executeTakeFirst();

      if (!existing) return 'not_found' as const;

      // Update template name if provided
      if (input.name !== undefined) {
        await trx
          .updateTable('formTemplates')
          .set({ name: input.name })
          .where('id', '=', id)
          .execute();
      }

      // Replace translations if provided
      if (input.translations !== undefined) {
        await trx
          .deleteFrom('formTemplateTranslations')
          .where('templateId', '=', id)
          .execute();

        const transEntries = [...input.translations.entries()];
        if (transEntries.length > 0) {
          await trx
            .insertInto('formTemplateTranslations')
            .values(transEntries.map(([locale, name]) => ({ templateId: id, locale, name })))
            .execute();
        }
      }

      // Replace fields if provided
      if (input.fields !== undefined) {
        // CASCADE deletes field_translations too
        await trx
          .deleteFrom('formFields')
          .where('templateId', '=', id)
          .execute();

        await this.insertFields(trx, id, input.fields);
      }

      return 'updated' as const;
    });

    if (updateResult === 'not_found') return undefined;

    // Re-fetch full template after transaction commits
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const { numDeletedRows } = await this.db
      .deleteFrom('formTemplates')
      .where('id', '=', id)
      .executeTakeFirst();

    return numDeletedRows > 0n;
  }

  private async insertFields(
    trx: Kysely<Database>,
    templateId: number,
    fieldInputs: readonly CreateFormFieldInput[],
  ): Promise<FormField[]> {
    const fields: FormField[] = [];

    for (const fieldInput of fieldInputs) {
      const fieldRow = await trx
        .insertInto('formFields')
        .values({
          templateId,
          name: fieldInput.name,
          fieldType: fieldInput.fieldType,
          validation: JSON.stringify(fieldInput.validation),
          isRequired: fieldInput.isRequired,
          displayOrder: fieldInput.displayOrder,
          options: JSON.stringify(serializeOptions(fieldInput.options)),
          presentation: JSON.stringify(fieldInput.presentation),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const fieldId = fieldRow.id;

      // Insert field translations
      const fieldTransEntries = [...fieldInput.translations.entries()];
      if (fieldTransEntries.length > 0) {
        await trx
          .insertInto('formFieldTranslations')
          .values(fieldTransEntries.map(([locale, trans]) => ({
            fieldId,
            locale,
            label: trans.label,
            placeholder: trans.placeholder,
            helpText: trans.helpText,
          })))
          .execute();
      }

      fields.push({
        id: fieldId,
        name: fieldInput.name,
        fieldType: fieldInput.fieldType,
        validation: fieldInput.validation,
        isRequired: fieldInput.isRequired,
        displayOrder: fieldInput.displayOrder,
        options: fieldInput.options,
        presentation: fieldInput.presentation,
        translations: fieldInput.translations,
      });
    }

    return fields;
  }
}
