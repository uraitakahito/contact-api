/**
 * @module create-form-template
 * @description Driving Port — フォームテンプレート作成ユースケース。
 */

import type { FormTemplateRepository } from '../domain/form-template-repository.js';
import { generateHtmlId } from '../domain/form-template.js';
import type { FormTemplate, FormTemplateInput } from '../domain/form-template.js';

export class CreateFormTemplateUseCase {
  private readonly formTemplateRepository: FormTemplateRepository;

  constructor(formTemplateRepository: FormTemplateRepository) {
    this.formTemplateRepository = formTemplateRepository;
  }

  async execute(input: FormTemplateInput): Promise<FormTemplate> {
    return this.formTemplateRepository.create({
      ...input,
      fields: input.fields.map((f) => ({
        ...f,
        htmlId: f.htmlId ?? generateHtmlId(f.name),
      })),
    });
  }
}
