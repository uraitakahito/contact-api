/**
 * @module schemas
 * @description Driving Adapter 補助 — Zod バリデーションスキーマ。
 *
 * Driving Adapter が HTTP リクエストを検証するために使用。
 */

import { z } from 'zod';

const contactStatusSchema = z.enum(['new', 'in_progress', 'resolved', 'closed']);

export const createContactBodySchema = z.object({
  lastName: z.string().min(1, 'Last name cannot be empty'),
  firstName: z.string().min(1, 'First name cannot be empty'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty'),
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
