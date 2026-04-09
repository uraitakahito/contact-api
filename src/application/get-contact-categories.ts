/**
 * @module get-contact-categories
 * @description Driving Port（駆動するポート） — 問い合わせ種別一覧取得ユースケース。
 */

import type { ContactCategory } from '../domain/contact-category.js';
import type { ContactCategoryRepository } from '../domain/contact-category-repository.js';

export class GetContactCategoriesUseCase {
  private readonly contactCategoryRepository: ContactCategoryRepository;

  constructor(contactCategoryRepository: ContactCategoryRepository) {
    this.contactCategoryRepository = contactCategoryRepository;
  }

  async execute(): Promise<ContactCategory[]> {
    return this.contactCategoryRepository.findAll();
  }
}
