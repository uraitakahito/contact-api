/**
 * @module get-form-template-by-id
 * @description Driving Port — フォームテンプレート個別取得ユースケース。
 */

import { FormTemplateNotFoundError } from '../domain/errors.js';
import type { FormTemplateRepository } from '../domain/form-template-repository.js';
import type { FormTemplate } from '../domain/form-template.js';

export class GetFormTemplateByIdUseCase {
  private readonly formTemplateRepository: FormTemplateRepository;

  constructor(formTemplateRepository: FormTemplateRepository) {
    this.formTemplateRepository = formTemplateRepository;
  }

  async execute(id: number): Promise<FormTemplate> {
    const template = await this.formTemplateRepository.findById(id);
    if (!template) {
      throw new FormTemplateNotFoundError(id);
    }
    return template;
  }
}
