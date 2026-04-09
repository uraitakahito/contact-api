/**
 * @module contact
 * @description ドメインモデル — Contact エンティティの型定義。
 *
 * ビジネスの中心概念を表現し、外部技術に一切依存しない。
 */

export type ContactStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

export interface Contact {
  id: number;
  lastName: string;
  firstName: string;
  email: string;
  phone: string | null;
  message: string;
  status: ContactStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactInput {
  lastName: string;
  firstName: string;
  email: string;
  phone?: string | undefined;
  message: string;
}

export interface UpdateContactInput {
  lastName?: string | undefined;
  firstName?: string | undefined;
  email?: string | undefined;
  phone?: string | null | undefined;
  message?: string | undefined;
  status?: ContactStatus | undefined;
}
