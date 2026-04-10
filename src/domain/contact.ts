/**
 * @module contact
 * @description ドメインモデル — Contact エンティティの型定義。
 *
 * ビジネスの中心概念を表現し、外部技術に一切依存しない。
 */

export type ContactStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

export interface Contact {
  id: number;
  templateId: number;
  userId: string;
  data: Record<string, unknown>;
  status: ContactStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactInput {
  templateId: number;
  data: Record<string, unknown>;
}

const validNextStatus: Record<ContactStatus, ContactStatus | null> = {
  new: 'in_progress',
  in_progress: 'resolved',
  resolved: 'closed',
  closed: null,
};

export function isValidStatusTransition(from: ContactStatus, to: ContactStatus): boolean {
  return validNextStatus[from] === to;
}
