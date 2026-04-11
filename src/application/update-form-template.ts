/**
 * @module update-form-template
 * @description Driving Port — フォームテンプレート更新ユースケース。
 */

import { FormTemplateNotFoundError } from '../domain/errors.js';
import type { FormTemplateRepository } from '../domain/form-template-repository.js';
import { generateHtmlId } from '../domain/form-template.js';
import type { FormTemplate, FormTemplateUpdateInput } from '../domain/form-template.js';

export class UpdateFormTemplateUseCase {
  private readonly formTemplateRepository: FormTemplateRepository;

  constructor(formTemplateRepository: FormTemplateRepository) {
    this.formTemplateRepository = formTemplateRepository;
  }

  async execute(id: number, input: FormTemplateUpdateInput): Promise<FormTemplate> {
    const { fields, ...rest } = input;
    const resolvedFields = fields?.map((f) => ({
      ...f,
      htmlId: f.htmlId ?? generateHtmlId(f.name),
    }));
    const updated = await this.formTemplateRepository.update(id, {
      ...rest,
      ...(resolvedFields !== undefined ? { fields: resolvedFields } : {}),
    });
    if (!updated) {
      throw new FormTemplateNotFoundError(id);
    }
    return updated;
  }
}
