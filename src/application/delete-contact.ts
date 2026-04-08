import { ContactNotFoundError } from '../domain/errors.js';
import type { ContactRepository } from '../domain/contact-repository.js';

export class DeleteContactUseCase {
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(id: number): Promise<void> {
    if (!(await this.contactRepository.delete(id))) {
      throw new ContactNotFoundError(id);
    }
  }
}
