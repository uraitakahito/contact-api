/**
 * @module update-contact-status
 * @description Driving Port — 問い合わせステータス更新ユースケース。
 */

import type { ContactAuthorizationService } from '../domain/contact-authorization-service.js';
import { isValidStatusTransition } from '../domain/contact.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import type { Contact, ContactStatus } from '../domain/contact.js';
import { AuthorizationError, ContactNotFoundError, InvalidStatusTransitionError } from '../domain/errors.js';

export class UpdateContactStatusUseCase {
  private readonly contactRepository: ContactRepository;
  private readonly authorizationService: ContactAuthorizationService;

  constructor(
    contactRepository: ContactRepository,
    authorizationService: ContactAuthorizationService,
  ) {
    this.contactRepository = contactRepository;
    this.authorizationService = authorizationService;
  }

  async execute(userId: string, id: number, status: ContactStatus): Promise<Contact> {
    if (!(await this.authorizationService.canEdit(userId, id))) {
      throw new AuthorizationError(userId, 'edit contact');
    }
    const contact = await this.contactRepository.findById(id);
    if (!contact) {
      throw new ContactNotFoundError(id);
    }

    if (!isValidStatusTransition(contact.status, status)) {
      throw new InvalidStatusTransitionError(contact.status, status);
    }

    const updated = await this.contactRepository.updateStatus(id, status);
    if (!updated) {
      throw new ContactNotFoundError(id);
    }
    return updated;
  }
}
