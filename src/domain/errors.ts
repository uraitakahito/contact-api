/**
 * @module errors
 * @description ドメインモデル — ドメイン固有のエラークラス。
 *
 * ビジネスルール違反を表現し、外部技術に一切依存しない。
 */

export class ContactNotFoundError extends Error {
  public readonly id: number;

  constructor(id: number) {
    super(`Contact with id ${id.toString()} not found`);
    this.name = 'ContactNotFoundError';
    this.id = id;
  }
}

export class ContactValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContactValidationError';
  }
}
