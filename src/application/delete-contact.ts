/**
 * @module delete-contact
 * @description Driving Port（駆動するポート） — 問い合わせ削除ユースケース。
 */

import { ContactNotFoundError } from '../domain/errors.js';
import type { ContactRepository } from '../domain/contact-repository.js';

export class DeleteContactUseCase {
  private readonly contactRepository: ContactRepository;

  constructor(contactRepository: ContactRepository) {
    this.contactRepository = contactRepository;
  }

  async execute(id: number): Promise<void> {
    if (!(await this.contactRepository.delete(id))) {
      throw new ContactNotFoundError(id);
    }
  }
}
