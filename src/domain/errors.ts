/**
 * @module errors
 * @description ドメインモデル — ドメイン固有のエラークラス。
 *
 * ビジネスルール違反を表現し、外部技術に一切依存しない。
 */

export class ContactNotFoundError extends Error {
  constructor(public readonly id: number) {
    super(`Contact with id ${id.toString()} not found`);
    this.name = 'ContactNotFoundError';
  }
}

export class ContactValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContactValidationError';
  }
}
