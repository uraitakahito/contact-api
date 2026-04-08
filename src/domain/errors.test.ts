import { describe, expect, it } from 'vitest';
import { ContactNotFoundError, ContactValidationError } from './errors.js';

describe('ContactNotFoundError', () => {
  it('should have the correct message and id', () => {
    const error = new ContactNotFoundError(42);
    expect(error.message).toBe('Contact with id 42 not found');
    expect(error.id).toBe(42);
    expect(error.name).toBe('ContactNotFoundError');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('ContactValidationError', () => {
  it('should have the correct message', () => {
    const error = new ContactValidationError('Name cannot be empty');
    expect(error.message).toBe('Name cannot be empty');
    expect(error.name).toBe('ContactValidationError');
    expect(error).toBeInstanceOf(Error);
  });
});
