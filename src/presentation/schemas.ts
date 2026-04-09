/**
 * @module schemas
 * @description Driving Adapter 補助 — Zod バリデーションスキーマ。
 *
 * Driving Adapter が HTTP リクエストを検証するために使用。
 */

import { z } from 'zod/v4';

const contactStatusSchema = z.enum(['new', 'in_progress', 'resolved', 'closed']);

export const createContactBodySchema = z.object({
  lastName: z.string().min(1, { error: 'Last name cannot be empty' }),
  firstName: z.string().min(1, { error: 'First name cannot be empty' }),
  email: z.email({ error: 'Invalid email format' }),
  phone: z.string().optional(),
  categoryId: z.number().int().positive(),
  message: z.string().min(1, { error: 'Message cannot be empty' }),
});

export const updateContactStatusBodySchema = z.object({
  status: contactStatusSchema,
});

export const contactIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const contactsQuerySchema = z.object({
  status: contactStatusSchema.optional(),
});

export const contactCategoriesQuerySchema = z.object({
  locale: z.string().min(1).default('en'),
});
