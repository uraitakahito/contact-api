/**
 * @module delete-form-template
 * @description Driving Port（駆動するポート） — フォームテンプレート削除ユースケース。
 */

import { FormTemplateNotFoundError } from '../domain/errors.js';
import type { FormTemplateRepository } from '../domain/form-template-repository.js';

export class DeleteFormTemplateUseCase {
  private readonly formTemplateRepository: FormTemplateRepository;

  constructor(formTemplateRepository: FormTemplateRepository) {
    this.formTemplateRepository = formTemplateRepository;
  }

  async execute(id: number): Promise<void> {
    if (!(await this.formTemplateRepository.delete(id))) {
      throw new FormTemplateNotFoundError(id);
    }
  }
}
