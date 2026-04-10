/**
 * @module delete-contact
 * @description Driving Port（駆動するポート） — 問い合わせ削除ユースケース。
 */

import type { ContactAuthorizationService } from '../domain/contact-authorization-service.js';
import { AuthorizationError, ContactNotFoundError } from '../domain/errors.js';
import type { ContactRepository } from '../domain/contact-repository.js';

export class DeleteContactUseCase {
  private readonly contactRepository: ContactRepository;
  private readonly authorizationService: ContactAuthorizationService;

  constructor(
    contactRepository: ContactRepository,
    authorizationService: ContactAuthorizationService,
  ) {
    this.contactRepository = contactRepository;
    this.authorizationService = authorizationService;
  }

  async execute(userId: string, id: number): Promise<void> {
    if (!(await this.authorizationService.canDelete(userId, id))) {
      throw new AuthorizationError(userId, 'delete contact');
    }
    if (!(await this.contactRepository.delete(id))) {
      throw new ContactNotFoundError(id);
    }
    await this.authorizationService.revokeOwnership(userId, id);
  }
}
