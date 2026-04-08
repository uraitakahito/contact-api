import type { ContactRepository } from '../domain/contact-repository.js';
import type { Contact, ContactStatus } from '../domain/contact.js';

export class GetContactsUseCase {
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(filter?: { status?: ContactStatus }): Promise<Contact[]> {
    return this.contactRepository.findAll(filter);
  }
}
