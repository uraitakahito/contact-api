/**
 * @module get-contact-by-id
 * @description Driving Port（駆動するポート） — 問い合わせ個別取得ユースケース。
 */

import { ContactNotFoundError } from '../domain/errors.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import type { Contact } from '../domain/contact.js';

export class GetContactByIdUseCase {
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(id: number): Promise<Contact> {
    const contact = await this.contactRepository.findById(id);
    if (!contact) {
      throw new ContactNotFoundError(id);
    }
    return contact;
  }
}
