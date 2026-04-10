import { describe, expect, it, vi } from 'vitest';
import type { ContactAuthorizationService } from '../domain/contact-authorization-service.js';
import { AuthorizationError, ContactNotFoundError, InvalidStatusTransitionError } from '../domain/errors.js';
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
  templateId: 1,
  userId: 'alice',
  data: { name: 'Test', email: 'test@example.com', message: 'Hello' },
  status: 'new',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('UpdateContactStatusUseCase', () => {
  it('should update status with a valid transition when authorized', async () => {
    const repo = createMockRepository();
    const authz = createMockAuthorizationService();
    const updatedContact = { ...sampleContact, status: 'in_progress' as const };
    vi.mocked(authz.canEdit).mockResolvedValue(true);
    vi.mocked(repo.findById).mockResolvedValue(sampleContact);
    vi.mocked(repo.updateStatus).mockResolvedValue(updatedContact);
    const useCase = new UpdateContactStatusUseCase(repo, authz);

    const result = await useCase.execute('alice', 1, 'in_progress');

    expect(result).toEqual(updatedContact);
    expect(authz.canEdit).toHaveBeenCalledWith('alice', 1);
    expect(repo.findById).toHaveBeenCalledWith(1);
    expect(repo.updateStatus).toHaveBeenCalledWith(1, 'in_progress');
  });

  it('should throw AuthorizationError when not authorized', async () => {
    const repo = createMockRepository();
    const authz = createMockAuthorizationService();
    vi.mocked(authz.canEdit).mockResolvedValue(false);
    const useCase = new UpdateContactStatusUseCase(repo, authz);

    await expect(useCase.execute('bob', 1, 'in_progress')).rejects.toThrow(AuthorizationError);
    expect(repo.findById).not.toHaveBeenCalled();
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('should throw ContactNotFoundError when contact does not exist', async () => {
    const repo = createMockRepository();
    const authz = createMockAuthorizationService();
    vi.mocked(authz.canEdit).mockResolvedValue(true);
    vi.mocked(repo.findById).mockResolvedValue(undefined);
    const useCase = new UpdateContactStatusUseCase(repo, authz);

    await expect(useCase.execute('alice', 999, 'in_progress')).rejects.toThrow(ContactNotFoundError);
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('should throw InvalidStatusTransitionError for invalid transition', async () => {
    const repo = createMockRepository();
    const authz = createMockAuthorizationService();
    vi.mocked(authz.canEdit).mockResolvedValue(true);
    vi.mocked(repo.findById).mockResolvedValue(sampleContact);
    const useCase = new UpdateContactStatusUseCase(repo, authz);

    await expect(useCase.execute('alice', 1, 'closed')).rejects.toThrow(InvalidStatusTransitionError);
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });
});
