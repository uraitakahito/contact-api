/**
 * @module validation-message-formatter
 * @description Driving Adapter 補助 — 構造化バリデーションエラーをロケールに応じたメッセージに変換する。
 *
 * DB から読み込んだメッセージテンプレートとフィールドラベルを組み合わせて、
 * 人間が読めるエラーメッセージを生成する。
 */

import type { FieldValidationError } from '../domain/form-template.js';

export interface ResolvedValidationError {
  field: string;
  code: string;
  message: string;
}

export class ValidationMessageFormatter {
  /** code → locale → テンプレート文字列 */
  private readonly templates: Map<string, Map<string, string>>;

  constructor(templates: Map<string, Map<string, string>>) {
    this.templates = templates;
  }

  format(errors: FieldValidationError[], locale: string): ResolvedValidationError[] {
    return errors.map((error) => ({
      field: error.field,
      code: error.code,
      message: this.resolve(error, locale),
    }));
  }

  private resolve(error: FieldValidationError, locale: string): string {
    const localeMap = this.templates.get(error.code);
    const template = localeMap?.get(locale)
      ?? localeMap?.values().next().value
      ?? `${error.field}:${error.code}`;

    const label = error.labels.get(locale)
      ?? error.labels.values().next().value
      ?? error.field;

    return this.interpolate(template, { ...error.params, label });
  }

  private interpolate(template: string, params: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (match, key: string) => {
      const value = params[key];
      return value !== undefined ? String(value) : match;
    });
  }
}
