/**
 * @module update-form-template
 * @description Driving Port — フォームテンプレート更新ユースケース。
 */

import { FormTemplateNotFoundError } from '../domain/errors.js';
import type { FormTemplateRepository } from '../domain/form-template-repository.js';
import type { FormTemplate, UpdateFormTemplateInput } from '../domain/form-template.js';

export class UpdateFormTemplateUseCase {
  private readonly formTemplateRepository: FormTemplateRepository;

  constructor(formTemplateRepository: FormTemplateRepository) {
    this.formTemplateRepository = formTemplateRepository;
  }

  async execute(id: number, input: UpdateFormTemplateInput): Promise<FormTemplate> {
    const updated = await this.formTemplateRepository.update(id, input);
    if (!updated) {
      throw new FormTemplateNotFoundError(id);
    }
    return updated;
  }
}
