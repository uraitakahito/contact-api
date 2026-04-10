/**
 * @module openfga-contact-authorization-service
 * @description Driven Adapter（駆動されるアダプター）
 *
 * ContactAuthorizationService（Driven Port）の OpenFGA 実装。
 * Domain 層のインターフェースを OpenFGA SDK の API 呼び出しに変換する。
 *
 * @see {@link file://../domain/contact-authorization-service.ts} Driven Port（インターフェース）
 */

import type { OpenFgaClient } from '@openfga/sdk';
import type { ContactAuthorizationService } from '../domain/contact-authorization-service.js';

export class OpenFgaContactAuthorizationService implements ContactAuthorizationService {
  private readonly client: OpenFgaClient;

  constructor(client: OpenFgaClient) {
    this.client = client;
  }

  async canView(userId: string, contactId: number): Promise<boolean> {
    const result = await this.client.check({
      user: `user:${userId}`,
      relation: 'can_view',
      object: `contact:${contactId.toString()}`,
    });
    return result.allowed ?? false;
  }

  async canEdit(userId: string, contactId: number): Promise<boolean> {
    const result = await this.client.check({
      user: `user:${userId}`,
      relation: 'can_edit',
      object: `contact:${contactId.toString()}`,
    });
    return result.allowed ?? false;
  }

  async canDelete(userId: string, contactId: number): Promise<boolean> {
    const result = await this.client.check({
      user: `user:${userId}`,
      relation: 'can_delete',
      object: `contact:${contactId.toString()}`,
    });
    return result.allowed ?? false;
  }

  async listViewableContactIds(userId: string): Promise<number[]> {
    const response = await this.client.listObjects({
      user: `user:${userId}`,
      relation: 'can_view',
      type: 'contact',
    });
    return response.objects.map((obj) => {
      const id = obj.split(':')[1];
      if (id === undefined) {
        throw new Error(`Unexpected object format from OpenFGA: ${obj}`);
      }
      return Number(id);
    });
  }

  async grantOwnership(userId: string, contactId: number): Promise<void> {
    const objectId = contactId.toString();
    await this.client.write({
      writes: [
        { user: `user:${userId}`, relation: 'owner', object: `contact:${objectId}` },
        { user: 'system:global', relation: 'parent', object: `contact:${objectId}` },
      ],
    });
  }

  async revokeOwnership(userId: string, contactId: number): Promise<void> {
    const objectId = contactId.toString();
    await this.client.write({
      deletes: [
        { user: `user:${userId}`, relation: 'owner', object: `contact:${objectId}` },
        { user: 'system:global', relation: 'parent', object: `contact:${objectId}` },
      ],
    });
  }
}
