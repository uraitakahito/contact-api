import { describe, expect, it, vi } from 'vitest';
import { ContactNotFoundError } from '../domain/errors.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import type { Contact } from '../domain/contact.js';
import { GetContactByIdUseCase } from './get-contact-by-id.js';

function createMockRepository(): ContactRepository {
  return {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

const sampleContact: Contact = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  phone: null,
  message: 'Test message body',
  status: 'new',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('GetContactByIdUseCase', () => {
  it('should return a contact when found', async () => {
    const repo = createMockRepository();
    vi.mocked(repo.findById).mockResolvedValue(sampleContact);
    const useCase = new GetContactByIdUseCase(repo);

    const result = await useCase.execute(1);

    expect(result).toEqual(sampleContact);
    expect(repo.findById).toHaveBeenCalledWith(1);
  });

  it('should throw ContactNotFoundError when not found', async () => {
    const repo = createMockRepository();
    vi.mocked(repo.findById).mockResolvedValue(undefined);
    const useCase = new GetContactByIdUseCase(repo);

    await expect(useCase.execute(999)).rejects.toThrow(ContactNotFoundError);
  });
});
