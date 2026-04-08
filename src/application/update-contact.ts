/**
 * @module update-contact
 * @description Driving Port（駆動するポート） — 問い合わせ更新ユースケース。
 */

import { ContactNotFoundError } from '../domain/errors.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import type { Contact, UpdateContactInput } from '../domain/contact.js';

export class UpdateContactUseCase {
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(id: number, input: UpdateContactInput): Promise<Contact> {
    const contact = await this.contactRepository.update(id, input);
    if (!contact) {
      throw new ContactNotFoundError(id);
    }
    return contact;
  }
}
