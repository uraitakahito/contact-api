import { ContactValidationError } from '../domain/errors.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import type { Contact, CreateContactInput } from '../domain/contact.js';

export class CreateContactUseCase {
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(input: CreateContactInput): Promise<Contact> {
    if (!input.name.trim()) {
      throw new ContactValidationError('Name cannot be empty');
    }
    if (!input.subject.trim()) {
      throw new ContactValidationError('Subject cannot be empty');
    }
    if (!input.message.trim()) {
      throw new ContactValidationError('Message cannot be empty');
    }
    return this.contactRepository.create(input);
  }
}
