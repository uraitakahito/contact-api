import { describe, expect, it, vi } from 'vitest';
import type { ContactAuthorizationService } from '../domain/contact-authorization-service.js';
import { AuthorizationError, ContactNotFoundError } from '../domain/errors.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import type { Contact } from '../domain/contact.js';
import { GetContactByIdUseCase } from './get-contact-by-id.js';

function createMockRepository(): ContactRepository {
  return {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
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

describe('GetContactByIdUseCase', () => {
  it('should return a contact when authorized and found', async () => {
    const repo = createMockRepository();
    const authz = createMockAuthorizationService();
    vi.mocked(authz.canView).mockResolvedValue(true);
    vi.mocked(repo.findById).mockResolvedValue(sampleContact);
    const useCase = new GetContactByIdUseCase(repo, authz);

    const result = await useCase.execute('alice', 1);

    expect(result).toEqual(sampleContact);
    expect(authz.canView).toHaveBeenCalledWith('alice', 1);
    expect(repo.findById).toHaveBeenCalledWith(1);
  });

  it('should throw AuthorizationError when not authorized', async () => {
    const repo = createMockRepository();
    const authz = createMockAuthorizationService();
    vi.mocked(authz.canView).mockResolvedValue(false);
    const useCase = new GetContactByIdUseCase(repo, authz);

    await expect(useCase.execute('bob', 1)).rejects.toThrow(AuthorizationError);
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('should throw ContactNotFoundError when authorized but not found', async () => {
    const repo = createMockRepository();
    const authz = createMockAuthorizationService();
    vi.mocked(authz.canView).mockResolvedValue(true);
    vi.mocked(repo.findById).mockResolvedValue(undefined);
    const useCase = new GetContactByIdUseCase(repo, authz);

    await expect(useCase.execute('alice', 999)).rejects.toThrow(ContactNotFoundError);
  });
});
