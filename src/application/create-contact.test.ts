import { describe, expect, it, vi } from 'vitest';
import type { ContactAuthorizationService } from '../domain/contact-authorization-service.js';
import type { ContactCategoryRepository } from '../domain/contact-category-repository.js';
import type { ContactCategory } from '../domain/contact-category.js';
import { ContactCategoryNotFoundError, ContactValidationError } from '../domain/errors.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import type { Contact } from '../domain/contact.js';
import { CreateContactUseCase } from './create-contact.js';

function createMockRepository(): ContactRepository {
  return {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
  };
}

function createMockCategoryRepository(): ContactCategoryRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
  };
}

function createMockAuthorizationService(): ContactAuthorizationService {
  return {
    canView: vi.fn(),
    canEdit: vi.fn(),
    canDelete: vi.fn(),
    listViewableContactIds: vi.fn(),
    grantOwnership: vi.fn(),
    revokeOwnership: vi.fn(),
  };
}

const sampleCategory: ContactCategory = {
  id: 1,
  translations: new Map([['ja', '一般的なお問合せ']]),
  displayOrder: 1,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const sampleContact: Contact = {
  id: 1,
  lastName: 'Test',
  firstName: 'User',
  email: 'test@example.com',
  phone: null,
  categoryId: 1,
  message: 'Test message body',
  status: 'new',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('CreateContactUseCase', () => {
  it('should create a contact and grant ownership', async () => {
    const repo = createMockRepository();
    const categoryRepo = createMockCategoryRepository();
    const authz = createMockAuthorizationService();
    vi.mocked(repo.create).mockResolvedValue(sampleContact);
    vi.mocked(categoryRepo.findById).mockResolvedValue(sampleCategory);
    const useCase = new CreateContactUseCase(repo, categoryRepo, authz);

    const input = {
      lastName: 'Test',
      firstName: 'User',
      email: 'test@example.com',
      categoryId: 1,
      message: 'Test message body',
    };
    const result = await useCase.execute('alice', input);

    expect(result).toEqual(sampleContact);
    expect(repo.create).toHaveBeenCalledWith(input);
    expect(authz.grantOwnership).toHaveBeenCalledWith('alice', 1);
  });

  it('should throw ContactValidationError for empty lastName', async () => {
    const repo = createMockRepository();
    const categoryRepo = createMockCategoryRepository();
    const authz = createMockAuthorizationService();
    const useCase = new CreateContactUseCase(repo, categoryRepo, authz);

    await expect(
      useCase.execute('alice', { lastName: '', firstName: 'User', email: 'test@example.com', categoryId: 1, message: 'Msg' }),
    ).rejects.toThrow(ContactValidationError);
    expect(repo.create).not.toHaveBeenCalled();
    expect(authz.grantOwnership).not.toHaveBeenCalled();
  });

  it('should throw ContactValidationError for whitespace-only lastName', async () => {
    const repo = createMockRepository();
    const categoryRepo = createMockCategoryRepository();
    const authz = createMockAuthorizationService();
    const useCase = new CreateContactUseCase(repo, categoryRepo, authz);

    await expect(
      useCase.execute('alice', { lastName: '   ', firstName: 'User', email: 'test@example.com', categoryId: 1, message: 'Msg' }),
    ).rejects.toThrow(ContactValidationError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('should throw ContactValidationError for empty firstName', async () => {
    const repo = createMockRepository();
    const categoryRepo = createMockCategoryRepository();
    const authz = createMockAuthorizationService();
    const useCase = new CreateContactUseCase(repo, categoryRepo, authz);

    await expect(
      useCase.execute('alice', { lastName: 'Test', firstName: '', email: 'test@example.com', categoryId: 1, message: 'Msg' }),
    ).rejects.toThrow(ContactValidationError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('should throw ContactValidationError for whitespace-only firstName', async () => {
    const repo = createMockRepository();
    const categoryRepo = createMockCategoryRepository();
    const authz = createMockAuthorizationService();
    const useCase = new CreateContactUseCase(repo, categoryRepo, authz);

    await expect(
      useCase.execute('alice', { lastName: 'Test', firstName: '   ', email: 'test@example.com', categoryId: 1, message: 'Msg' }),
    ).rejects.toThrow(ContactValidationError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('should throw ContactValidationError for empty message', async () => {
    const repo = createMockRepository();
    const categoryRepo = createMockCategoryRepository();
    const authz = createMockAuthorizationService();
    const useCase = new CreateContactUseCase(repo, categoryRepo, authz);

    await expect(
      useCase.execute('alice', { lastName: 'Test', firstName: 'User', email: 'test@example.com', categoryId: 1, message: '' }),
    ).rejects.toThrow(ContactValidationError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('should throw ContactCategoryNotFoundError for non-existent categoryId', async () => {
    const repo = createMockRepository();
    const categoryRepo = createMockCategoryRepository();
    const authz = createMockAuthorizationService();
    vi.mocked(categoryRepo.findById).mockResolvedValue(undefined);
    const useCase = new CreateContactUseCase(repo, categoryRepo, authz);

    await expect(
      useCase.execute('alice', { lastName: 'Test', firstName: 'User', email: 'test@example.com', categoryId: 999, message: 'Msg' }),
    ).rejects.toThrow(ContactCategoryNotFoundError);
    expect(repo.create).not.toHaveBeenCalled();
    expect(authz.grantOwnership).not.toHaveBeenCalled();
  });
});
