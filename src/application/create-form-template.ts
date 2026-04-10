/**
 * @module create-form-template
 * @description Driving Port（駆動するポート） — フォームテンプレート作成ユースケース。
 */

import type { FormTemplateRepository } from '../domain/form-template-repository.js';
import type { CreateFormTemplateInput, FormTemplate } from '../domain/form-template.js';

export class CreateFormTemplateUseCase {
  private readonly formTemplateRepository: FormTemplateRepository;

  constructor(formTemplateRepository: FormTemplateRepository) {
    this.formTemplateRepository = formTemplateRepository;
  }

  async execute(input: CreateFormTemplateInput): Promise<FormTemplate> {
    return this.formTemplateRepository.create(input);
  }
}
