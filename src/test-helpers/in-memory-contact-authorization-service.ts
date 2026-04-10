/**
 * @module in-memory-contact-authorization-service
 * @description テスト用 — ContactAuthorizationService のインメモリ実装。
 *
 * OpenFGA の推移的リレーション解決をシミュレートし、
 * grantOwnership 時に owner/can_view/can_edit/can_delete を自動展開する。
 */

import type { ContactAuthorizationService } from '../domain/contact-authorization-service.js';

export class InMemoryContactAuthorizationService implements ContactAuthorizationService {
  private readonly tuples = new Set<string>();

  private key(userId: string, relation: string, contactId: number): string {
    return `user:${userId}#${relation}@contact:${contactId.toString()}`;
  }

  canView(userId: string, contactId: number): Promise<boolean> {
    return Promise.resolve(this.tuples.has(this.key(userId, 'can_view', contactId)));
  }

  canEdit(userId: string, contactId: number): Promise<boolean> {
    return Promise.resolve(this.tuples.has(this.key(userId, 'can_edit', contactId)));
  }

  canDelete(userId: string, contactId: number): Promise<boolean> {
    return Promise.resolve(this.tuples.has(this.key(userId, 'can_delete', contactId)));
  }

  listViewableContactIds(userId: string): Promise<number[]> {
    const prefix = `user:${userId}#can_view@contact:`;
    const ids: number[] = [];
    for (const tuple of this.tuples) {
      if (tuple.startsWith(prefix)) {
        ids.push(Number(tuple.slice(prefix.length)));
      }
    }
    return Promise.resolve(ids);
  }

  grantOwnership(userId: string, contactId: number): Promise<void> {
    this.tuples.add(this.key(userId, 'owner', contactId));
    this.tuples.add(this.key(userId, 'can_view', contactId));
    this.tuples.add(this.key(userId, 'can_edit', contactId));
    this.tuples.add(this.key(userId, 'can_delete', contactId));
    return Promise.resolve();
  }

  revokeOwnership(userId: string, contactId: number): Promise<void> {
    this.tuples.delete(this.key(userId, 'owner', contactId));
    this.tuples.delete(this.key(userId, 'can_view', contactId));
    this.tuples.delete(this.key(userId, 'can_edit', contactId));
    this.tuples.delete(this.key(userId, 'can_delete', contactId));
    return Promise.resolve();
  }

  clear(): void {
    this.tuples.clear();
  }
}
