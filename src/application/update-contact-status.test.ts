import { describe, expect, it, vi } from 'vitest';
import { ContactNotFoundError, InvalidStatusTransitionError } from '../domain/errors.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import type { Contact } from '../domain/contact.js';
import { UpdateContactStatusUseCase } from './update-contact-status.js';

function createMockRepository(): ContactRepository {
  return {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
  };
}

const sampleContact: Contact = {
  id: 1,
  lastName: 'Test',
  firstName: 'User',
  email: 'test@example.com',
  phone: null,
  message: 'Test message body',
  status: 'new',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('UpdateContactStatusUseCase', () => {
  it('should update status with a valid transition', async () => {
    const repo = createMockRepository();
    const updatedContact = { ...sampleContact, status: 'in_progress' as const };
    vi.mocked(repo.findById).mockResolvedValue(sampleContact);
    vi.mocked(repo.updateStatus).mockResolvedValue(updatedContact);
    const useCase = new UpdateContactStatusUseCase(repo);

    const result = await useCase.execute(1, 'in_progress');

    expect(result).toEqual(updatedContact);
    expect(repo.findById).toHaveBeenCalledWith(1);
    expect(repo.updateStatus).toHaveBeenCalledWith(1, 'in_progress');
  });

  it('should throw ContactNotFoundError when contact does not exist', async () => {
    const repo = createMockRepository();
    vi.mocked(repo.findById).mockResolvedValue(undefined);
    const useCase = new UpdateContactStatusUseCase(repo);

    await expect(useCase.execute(999, 'in_progress')).rejects.toThrow(ContactNotFoundError);
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('should throw InvalidStatusTransitionError for invalid transition', async () => {
    const repo = createMockRepository();
    vi.mocked(repo.findById).mockResolvedValue(sampleContact);
    const useCase = new UpdateContactStatusUseCase(repo);

    await expect(useCase.execute(1, 'closed')).rejects.toThrow(InvalidStatusTransitionError);
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });
});
