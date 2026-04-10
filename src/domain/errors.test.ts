import { describe, expect, it } from 'vitest';
import { AuthorizationError, ContactCategoryNotFoundError, ContactNotFoundError, ContactValidationError, InvalidStatusTransitionError } from './errors.js';

describe('AuthorizationError', () => {
  it('should have the correct message, userId, and action', () => {
    const error = new AuthorizationError('alice', 'view contact');
    expect(error.message).toBe("User 'alice' is not authorized to 'view contact'");
    expect(error.userId).toBe('alice');
    expect(error.action).toBe('view contact');
    expect(error.name).toBe('AuthorizationError');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('ContactCategoryNotFoundError', () => {
  it('should have the correct message and id', () => {
    const error = new ContactCategoryNotFoundError(5);
    expect(error.message).toBe('Contact category with id 5 not found');
    expect(error.id).toBe(5);
    expect(error.name).toBe('ContactCategoryNotFoundError');
    expect(error).toBeInstanceOf(Error);
  });
});

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

describe('InvalidStatusTransitionError', () => {
  it('should have the correct message, from, and to', () => {
    const error = new InvalidStatusTransitionError('new', 'closed');
    expect(error.message).toBe("Invalid status transition from 'new' to 'closed'");
    expect(error.from).toBe('new');
    expect(error.to).toBe('closed');
    expect(error.name).toBe('InvalidStatusTransitionError');
    expect(error).toBeInstanceOf(Error);
  });
});
