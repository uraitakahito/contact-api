import { describe, expect, it, vi } from 'vitest';
import type { ContactAuthorizationService } from '../domain/contact-authorization-service.js';
import type { FormTemplateRepository } from '../domain/form-template-repository.js';
import { FormFieldValidationError, FormTemplateNotFoundError } from '../domain/errors.js';
import type { ContactRepository } from '../domain/contact-repository.js';
import type { Contact } from '../domain/contact.js';
import type { FormTemplate } from '../domain/form-template.js';
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

function createMockFormTemplateRepository(): FormTemplateRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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

const sampleTemplate: FormTemplate = {
  id: 1,
  name: 'contact-form',
  translations: new Map([['ja', '問い合わせフォーム']]),
  fields: [
    {
      id: 1, name: 'name', fieldType: 'text', validationType: 'none',
      isRequired: true, displayOrder: 1, options: [], translations: new Map(),
    },
    {
      id: 2, name: 'email', fieldType: 'text', validationType: 'email',
      isRequired: true, displayOrder: 2, options: [], translations: new Map(),
    },
    {
      id: 3, name: 'message', fieldType: 'textarea', validationType: 'none',
      isRequired: true, displayOrder: 3, options: [], translations: new Map(),
    },
  ],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const sampleContact: Contact = {
  id: 1,
  templateId: 1,
  userId: 'alice',
  data: { name: 'Taro', email: 'taro@example.com', message: 'Hello' },
  status: 'new',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('CreateContactUseCase', () => {
  it('should create a contact and grant ownership', async () => {
    const repo = createMockRepository();
    const templateRepo = createMockFormTemplateRepository();
    const authz = createMockAuthorizationService();
    vi.mocked(templateRepo.findById).mockResolvedValue(sampleTemplate);
    vi.mocked(repo.create).mockResolvedValue(sampleContact);
    const useCase = new CreateContactUseCase(repo, templateRepo, authz);

    const input = { templateId: 1, data: { name: 'Taro', email: 'taro@example.com', message: 'Hello' } };
    const result = await useCase.execute('alice', input);

    expect(result).toEqual(sampleContact);
    expect(repo.create).toHaveBeenCalledWith('alice', input);
    expect(authz.grantOwnership).toHaveBeenCalledWith('alice', 1);
  });

  it('should throw FormTemplateNotFoundError for non-existent templateId', async () => {
    const repo = createMockRepository();
    const templateRepo = createMockFormTemplateRepository();
    const authz = createMockAuthorizationService();
    vi.mocked(templateRepo.findById).mockResolvedValue(undefined);
    const useCase = new CreateContactUseCase(repo, templateRepo, authz);

    await expect(
      useCase.execute('alice', { templateId: 999, data: {} }),
    ).rejects.toThrow(FormTemplateNotFoundError);
    expect(repo.create).not.toHaveBeenCalled();
    expect(authz.grantOwnership).not.toHaveBeenCalled();
  });

  it('should throw FormFieldValidationError for missing required field', async () => {
    const repo = createMockRepository();
    const templateRepo = createMockFormTemplateRepository();
    const authz = createMockAuthorizationService();
    vi.mocked(templateRepo.findById).mockResolvedValue(sampleTemplate);
    const useCase = new CreateContactUseCase(repo, templateRepo, authz);

    await expect(
      useCase.execute('alice', { templateId: 1, data: { name: 'Taro', email: 'taro@example.com' } }),
    ).rejects.toThrow(FormFieldValidationError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('should throw FormFieldValidationError for invalid email', async () => {
    const repo = createMockRepository();
    const templateRepo = createMockFormTemplateRepository();
    const authz = createMockAuthorizationService();
    vi.mocked(templateRepo.findById).mockResolvedValue(sampleTemplate);
    const useCase = new CreateContactUseCase(repo, templateRepo, authz);

    await expect(
      useCase.execute('alice', { templateId: 1, data: { name: 'Taro', email: 'bad', message: 'Hi' } }),
    ).rejects.toThrow(FormFieldValidationError);
    expect(repo.create).not.toHaveBeenCalled();
  });
});
