import { describe, expect, it, vi } from 'vitest';
import { ContactValidationError } from '../domain/errors.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import type { Contact } from '../domain/contact.js';
import { CreateContactUseCase } from './create-contact.js';

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
  lastName: 'Test',
  firstName: 'User',
  email: 'test@example.com',
  phone: null,
  message: 'Test message body',
  status: 'new',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('CreateContactUseCase', () => {
  it('should create a contact with valid input', async () => {
    const repo = createMockRepository();
    vi.mocked(repo.create).mockResolvedValue(sampleContact);
    const useCase = new CreateContactUseCase(repo);

    const input = {
      lastName: 'Test',
      firstName: 'User',
      email: 'test@example.com',
      message: 'Test message body',
    };
    const result = await useCase.execute(input);

    expect(result).toEqual(sampleContact);
    expect(repo.create).toHaveBeenCalledWith(input);
  });

  it('should throw ContactValidationError for empty lastName', async () => {
    const repo = createMockRepository();
    const useCase = new CreateContactUseCase(repo);

    await expect(
      useCase.execute({ lastName: '', firstName: 'User', email: 'test@example.com', message: 'Msg' }),
    ).rejects.toThrow(ContactValidationError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('should throw ContactValidationError for whitespace-only lastName', async () => {
    const repo = createMockRepository();
    const useCase = new CreateContactUseCase(repo);

    await expect(
      useCase.execute({ lastName: '   ', firstName: 'User', email: 'test@example.com', message: 'Msg' }),
    ).rejects.toThrow(ContactValidationError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('should throw ContactValidationError for empty firstName', async () => {
    const repo = createMockRepository();
    const useCase = new CreateContactUseCase(repo);

    await expect(
      useCase.execute({ lastName: 'Test', firstName: '', email: 'test@example.com', message: 'Msg' }),
    ).rejects.toThrow(ContactValidationError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('should throw ContactValidationError for whitespace-only firstName', async () => {
    const repo = createMockRepository();
    const useCase = new CreateContactUseCase(repo);

    await expect(
      useCase.execute({ lastName: 'Test', firstName: '   ', email: 'test@example.com', message: 'Msg' }),
    ).rejects.toThrow(ContactValidationError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('should throw ContactValidationError for empty message', async () => {
    const repo = createMockRepository();
    const useCase = new CreateContactUseCase(repo);

    await expect(
      useCase.execute({ lastName: 'Test', firstName: 'User', email: 'test@example.com', message: '' }),
    ).rejects.toThrow(ContactValidationError);
    expect(repo.create).not.toHaveBeenCalled();
  });
});
