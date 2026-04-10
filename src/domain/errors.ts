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

export class ContactCategoryNotFoundError extends Error {
  public readonly id: number;

  constructor(id: number) {
    super(`Contact category with id ${id.toString()} not found`);
    this.name = 'ContactCategoryNotFoundError';
    this.id = id;
  }
}

export class ContactValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContactValidationError';
  }
}

export class AuthorizationError extends Error {
  public readonly userId: string;
  public readonly action: string;

  constructor(userId: string, action: string) {
    super(`User '${userId}' is not authorized to '${action}'`);
    this.name = 'AuthorizationError';
    this.userId = userId;
    this.action = action;
  }
}

export class InvalidStatusTransitionError extends Error {
  public readonly from: string;
  public readonly to: string;

  constructor(from: string, to: string) {
    super(`Invalid status transition from '${from}' to '${to}'`);
    this.name = 'InvalidStatusTransitionError';
    this.from = from;
    this.to = to;
  }
}
