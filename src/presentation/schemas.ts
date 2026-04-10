/**
 * @module schemas
 * @description Driving Adapter 補助 — Zod バリデーションスキーマ。
 *
 * Driving Adapter が HTTP リクエストを検証するために使用。
 */

import { z } from 'zod/v4';

const contactStatusSchema = z.enum(['new', 'in_progress', 'resolved', 'closed']);

// --- Contact schemas ---

export const createContactBodySchema = z.object({
  templateId: z.number().int().positive(),
  data: z.record(z.string(), z.unknown()),
});

export const updateContactStatusBodySchema = z.object({
  status: contactStatusSchema,
});

export const contactIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const contactsQuerySchema = z.object({
  status: contactStatusSchema.optional(),
  templateId: z.coerce.number().int().positive().optional(),
});

// --- Form template schemas ---

const fieldTypeSchema = z.enum(['text', 'textarea', 'select']);
const validationTypeSchema = z.enum(['none', 'email', 'phone', 'url']);

const validationSchema = z.object({
  type: validationTypeSchema.default('none'),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().positive().optional(),
}).default({ type: 'none' });

const presentationSchema = z.object({
  cssClass: z.string().optional(),
  htmlId: z.string().optional(),
}).default({});

const formFieldOptionSchema = z.object({
  value: z.string().min(1),
  labels: z.record(z.string(), z.string()),
});

const formFieldInputSchema = z.object({
  name: z.string().min(1),
  fieldType: fieldTypeSchema,
  validation: validationSchema,
  isRequired: z.boolean().default(false),
  displayOrder: z.number().int(),
  options: z.array(formFieldOptionSchema).default([]),
  presentation: presentationSchema,
  translations: z.record(z.string(), z.object({
    label: z.string(),
    placeholder: z.string().default(''),
    helpText: z.string().default(''),
  })).default({}),
});

export const createFormTemplateBodySchema = z.object({
  name: z.string().min(1),
  translations: z.record(z.string(), z.string()).default({}),
  fields: z.array(formFieldInputSchema),
});

export const updateFormTemplateBodySchema = z.object({
  name: z.string().min(1).optional(),
  translations: z.record(z.string(), z.string()).optional(),
  fields: z.array(formFieldInputSchema).optional(),
});

export const templateIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const formTemplatesQuerySchema = z.object({
  locale: z.string().min(1).default('en'),
});
