/**
 * @module get-form-templates
 * @description Driving Port（駆動するポート） — フォームテンプレート一覧取得ユースケース。
 */

import type { FormTemplateRepository } from '../domain/form-template-repository.js';
import type { FormTemplate } from '../domain/form-template.js';

export class GetFormTemplatesUseCase {
  private readonly formTemplateRepository: FormTemplateRepository;

  constructor(formTemplateRepository: FormTemplateRepository) {
    this.formTemplateRepository = formTemplateRepository;
  }

  async execute(): Promise<FormTemplate[]> {
    return this.formTemplateRepository.findAll();
  }
}
