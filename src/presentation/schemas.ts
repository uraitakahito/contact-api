/**
 * @module schemas
 * @description Driving Adapter 補助 — Zod バリデーションスキーマ。
 *
 * Driving Adapter が HTTP リクエストを検証するために使用。
 */

import { z } from 'zod';

const contactStatusSchema = z.enum(['new', 'in_progress', 'resolved', 'closed']);

export const createContactBodySchema = z.object({
  name: z.string().min(1, 'Name cannot be empty'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  subject: z.string().min(1, 'Subject cannot be empty'),
  message: z.string().min(1, 'Message cannot be empty'),
});

export const updateContactBodySchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().nullable().optional(),
  subject: z.string().min(1, 'Subject cannot be empty').optional(),
  message: z.string().min(1, 'Message cannot be empty').optional(),
  status: contactStatusSchema.optional(),
});

export const contactIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const contactsQuerySchema = z.object({
  status: contactStatusSchema.optional(),
});
