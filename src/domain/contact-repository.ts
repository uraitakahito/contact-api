import type { ContactStatus, CreateContactInput, Contact, UpdateContactInput } from './contact.js';

export interface ContactRepository {
  create(input: CreateContactInput): Promise<Contact>;
  findAll(filter?: { status?: ContactStatus }): Promise<Contact[]>;
  findById(id: number): Promise<Contact | undefined>;
  update(id: number, input: UpdateContactInput): Promise<Contact | undefined>;
  delete(id: number): Promise<boolean>;
}
