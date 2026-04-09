/**
 * @module update-contact-status
 * @description Driving Port（駆動するポート） — 問い合わせステータス更新ユースケース。
 */

import { isValidStatusTransition } from '../domain/contact.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import type { Contact, ContactStatus } from '../domain/contact.js';
import { ContactNotFoundError, InvalidStatusTransitionError } from '../domain/errors.js';

export class UpdateContactStatusUseCase {
  private readonly contactRepository: ContactRepository;

  constructor(contactRepository: ContactRepository) {
    this.contactRepository = contactRepository;
  }

  async execute(id: number, status: ContactStatus): Promise<Contact> {
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
