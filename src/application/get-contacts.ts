/**
 * @module get-contacts
 * @description Driving Port（駆動するポート） — 問い合わせ一覧取得ユースケース。
 */

import type { ContactRepository } from '../domain/contact-repository.js';
import type { Contact, ContactStatus } from '../domain/contact.js';

export class GetContactsUseCase {
  private readonly contactRepository: ContactRepository;

  constructor(contactRepository: ContactRepository) {
    this.contactRepository = contactRepository;
  }

  async execute(filter?: { status?: ContactStatus }): Promise<Contact[]> {
    return this.contactRepository.findAll(filter);
  }
}
