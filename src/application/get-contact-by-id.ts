/**
 * @module get-contact-by-id
 * @description Driving Port — 問い合わせ個別取得ユースケース。
 */

import type { ContactAuthorizationService } from '../domain/contact-authorization-service.js';
import { AuthorizationError, ContactNotFoundError } from '../domain/errors.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import type { Contact } from '../domain/contact.js';

export class GetContactByIdUseCase {
  private readonly contactRepository: ContactRepository;
  private readonly authorizationService: ContactAuthorizationService;

  constructor(
    contactRepository: ContactRepository,
    authorizationService: ContactAuthorizationService,
  ) {
    this.contactRepository = contactRepository;
    this.authorizationService = authorizationService;
  }

  async execute(userId: string, id: number): Promise<Contact> {
    if (!(await this.authorizationService.canView(userId, id))) {
      throw new AuthorizationError(userId, 'view contact');
    }
    const contact = await this.contactRepository.findById(id);
    if (!contact) {
      throw new ContactNotFoundError(id);
    }
    return contact;
  }
}
