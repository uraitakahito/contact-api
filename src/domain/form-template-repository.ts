/**
 * @module form-template-repository
 * @description Driven Port（駆動されるポート） — FormTemplateRepository インターフェース。
 *
 * Domain 層が「フォームテンプレートの永続化に何を求めるか」を定義するインターフェース。
 *
 * @see {@link file://../infrastructure/kysely-form-template-repository.ts} Driven Adapter（Kysely 実装）
 */

import type { CreateFormTemplateInput, FormTemplate, UpdateFormTemplateInput } from './form-template.js';

export interface FormTemplateRepository {
  findAll(): Promise<FormTemplate[]>;
  findById(id: number): Promise<FormTemplate | undefined>;
  create(input: CreateFormTemplateInput): Promise<FormTemplate>;
  update(id: number, input: UpdateFormTemplateInput): Promise<FormTemplate | undefined>;
  delete(id: number): Promise<boolean>;
}
