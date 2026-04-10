/**
 * @module get-contacts
 * @description Driving Port（駆動するポート） — 問い合わせ一覧取得ユースケース。
 */

import type { ContactAuthorizationService } from '../domain/contact-authorization-service.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import type { Contact, ContactStatus } from '../domain/contact.js';

export class GetContactsUseCase {
  private readonly contactRepository: ContactRepository;
  private readonly authorizationService: ContactAuthorizationService;

  constructor(
    contactRepository: ContactRepository,
    authorizationService: ContactAuthorizationService,
  ) {
    this.contactRepository = contactRepository;
    this.authorizationService = authorizationService;
  }

  async execute(userId: string, filter?: { status?: ContactStatus; templateId?: number }): Promise<Contact[]> {
    const ids = await this.authorizationService.listViewableContactIds(userId);
    return this.contactRepository.findAll({ ...filter, ids });
  }
}
