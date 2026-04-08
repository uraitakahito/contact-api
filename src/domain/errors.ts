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
