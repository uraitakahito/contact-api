/**
 * @module create-contact
 * @description Driving Port（駆動するポート） — 問い合わせ作成ユースケース。
 *
 * 外部からアプリケーションを駆動するための入り口。
 */

import type { ContactAuthorizationService } from '../domain/contact-authorization-service.js';
import type { FormTemplateRepository } from '../domain/form-template-repository.js';
import { FormFieldValidationError, FormTemplateNotFoundError } from '../domain/errors.js';
import { validateContactData } from '../domain/form-template.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import type { Contact, CreateContactInput } from '../domain/contact.js';

export class CreateContactUseCase {
  private readonly contactRepository: ContactRepository;
  private readonly formTemplateRepository: FormTemplateRepository;
  private readonly authorizationService: ContactAuthorizationService;

  constructor(
    contactRepository: ContactRepository,
    formTemplateRepository: FormTemplateRepository,
    authorizationService: ContactAuthorizationService,
  ) {
    this.contactRepository = contactRepository;
    this.formTemplateRepository = formTemplateRepository;
    this.authorizationService = authorizationService;
  }

  async execute(userId: string, input: CreateContactInput): Promise<Contact> {
    const template = await this.formTemplateRepository.findById(input.templateId);
    if (!template) {
      throw new FormTemplateNotFoundError(input.templateId);
    }

    const errors = validateContactData(template.fields, input.data);
    if (errors.length > 0) {
      throw new FormFieldValidationError(errors);
    }

    const contact = await this.contactRepository.create(userId, input);
    await this.authorizationService.grantOwnership(userId, contact.id);
    return contact;
  }
}
