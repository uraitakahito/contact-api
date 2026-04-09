/**
 * @module create-contact
 * @description Driving Port（駆動するポート） — 問い合わせ作成ユースケース。
 *
 * 外部からアプリケーションを駆動するための入り口。
 */

import type { ContactCategoryRepository } from '../domain/contact-category-repository.js';
import { ContactCategoryNotFoundError, ContactValidationError } from '../domain/errors.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import type { Contact, CreateContactInput } from '../domain/contact.js';

export class CreateContactUseCase {
  private readonly contactRepository: ContactRepository;
  private readonly contactCategoryRepository: ContactCategoryRepository;

  constructor(
    contactRepository: ContactRepository,
    contactCategoryRepository: ContactCategoryRepository,
  ) {
    this.contactRepository = contactRepository;
    this.contactCategoryRepository = contactCategoryRepository;
  }

  async execute(input: CreateContactInput): Promise<Contact> {
    if (!input.lastName.trim()) {
      throw new ContactValidationError('Last name cannot be empty');
    }
    if (!input.firstName.trim()) {
      throw new ContactValidationError('First name cannot be empty');
    }
    if (!input.message.trim()) {
      throw new ContactValidationError('Message cannot be empty');
    }

    const category = await this.contactCategoryRepository.findById(input.categoryId);
    if (!category) {
      throw new ContactCategoryNotFoundError(input.categoryId);
    }

    return this.contactRepository.create(input);
  }
}
