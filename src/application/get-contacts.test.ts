import { describe, expect, it, vi } from 'vitest';
import type { ContactAuthorizationService } from '../domain/contact-authorization-service.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import type { Contact } from '../domain/contact.js';
import { GetContactsUseCase } from './get-contacts.js';

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

describe('GetContactsUseCase', () => {
  it('should return only contacts the user can view', async () => {
    const repo = createMockRepository();
    const authz = createMockAuthorizationService();
    vi.mocked(authz.listViewableContactIds).mockResolvedValue([1, 3]);
    vi.mocked(repo.findAll).mockResolvedValue([sampleContact]);
    const useCase = new GetContactsUseCase(repo, authz);

    const result = await useCase.execute('alice');

    expect(result).toEqual([sampleContact]);
    expect(authz.listViewableContactIds).toHaveBeenCalledWith('alice');
    expect(repo.findAll).toHaveBeenCalledWith({ ids: [1, 3] });
  });

  it('should pass status and templateId filter along with ids', async () => {
    const repo = createMockRepository();
    const authz = createMockAuthorizationService();
    vi.mocked(authz.listViewableContactIds).mockResolvedValue([1, 2]);
    vi.mocked(repo.findAll).mockResolvedValue([]);
    const useCase = new GetContactsUseCase(repo, authz);

    await useCase.execute('alice', { status: 'new', templateId: 1 });

    expect(repo.findAll).toHaveBeenCalledWith({ status: 'new', templateId: 1, ids: [1, 2] });
  });

  it('should return empty array when user has no access', async () => {
    const repo = createMockRepository();
    const authz = createMockAuthorizationService();
    vi.mocked(authz.listViewableContactIds).mockResolvedValue([]);
    vi.mocked(repo.findAll).mockResolvedValue([]);
    const useCase = new GetContactsUseCase(repo, authz);

    const result = await useCase.execute('bob');

    expect(result).toEqual([]);
    expect(repo.findAll).toHaveBeenCalledWith({ ids: [] });
  });
});
