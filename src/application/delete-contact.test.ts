import { describe, expect, it, vi } from 'vitest';
import type { ContactAuthorizationService } from '../domain/contact-authorization-service.js';
import { AuthorizationError, ContactNotFoundError } from '../domain/errors.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import { DeleteContactUseCase } from './delete-contact.js';

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

describe('DeleteContactUseCase', () => {
  it('should delete a contact and revoke ownership when authorized', async () => {
    const repo = createMockRepository();
    const authz = createMockAuthorizationService();
    vi.mocked(authz.canDelete).mockResolvedValue(true);
    vi.mocked(repo.delete).mockResolvedValue(true);
    const useCase = new DeleteContactUseCase(repo, authz);

    await useCase.execute('alice', 1);

    expect(authz.canDelete).toHaveBeenCalledWith('alice', 1);
    expect(repo.delete).toHaveBeenCalledWith(1);
    expect(authz.revokeOwnership).toHaveBeenCalledWith('alice', 1);
  });

  it('should throw AuthorizationError when not authorized', async () => {
    const repo = createMockRepository();
    const authz = createMockAuthorizationService();
    vi.mocked(authz.canDelete).mockResolvedValue(false);
    const useCase = new DeleteContactUseCase(repo, authz);

    await expect(useCase.execute('bob', 1)).rejects.toThrow(AuthorizationError);
    expect(repo.delete).not.toHaveBeenCalled();
    expect(authz.revokeOwnership).not.toHaveBeenCalled();
  });

  it('should throw ContactNotFoundError when contact does not exist', async () => {
    const repo = createMockRepository();
    const authz = createMockAuthorizationService();
    vi.mocked(authz.canDelete).mockResolvedValue(true);
    vi.mocked(repo.delete).mockResolvedValue(false);
    const useCase = new DeleteContactUseCase(repo, authz);

    await expect(useCase.execute('alice', 999)).rejects.toThrow(ContactNotFoundError);
    expect(authz.revokeOwnership).not.toHaveBeenCalled();
  });
});
