import { describe, expect, it, vi } from 'vitest';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod/v4';
import { AuthorizationError, ContactNotFoundError, ContactValidationError, FormFieldValidationError, FormTemplateNotFoundError, InvalidStatusTransitionError } from '../domain/errors.js';
import { ERROR_CODE } from './envelope.js';
import { errorHandler } from './error-handler.js';

function createMockRequest() {
  return { log: { error: vi.fn() } } as unknown as FastifyRequest;
}

function createMockReply() {
  const reply = { status: vi.fn(), send: vi.fn() } as unknown as FastifyReply;
  vi.mocked(reply.status).mockReturnValue(reply);
  return reply;
}

describe('errorHandler', () => {
  it('should return 403 for AuthorizationError without logging', () => {
    const request = createMockRequest();
    const reply = createMockReply();

    errorHandler(new AuthorizationError('alice', 'view contact'), request, reply);

    expect(reply.status).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({
      success: 0,
      data: { code: ERROR_CODE.AUTHORIZATION_ERROR, message: expect.any(String) as string },
    });
    expect(request.log.error).not.toHaveBeenCalled();
  });

  it('should return 404 for ContactNotFoundError without logging', () => {
    const request = createMockRequest();
    const reply = createMockReply();

    errorHandler(new ContactNotFoundError(1), request, reply);

    expect(reply.status).toHaveBeenCalledWith(404);
    expect(reply.send).toHaveBeenCalledWith({
      success: 0,
      data: { code: ERROR_CODE.CONTACT_NOT_FOUND, message: expect.any(String) as string },
    });
    expect(request.log.error).not.toHaveBeenCalled();
  });

  it('should return 400 for FormTemplateNotFoundError without logging', () => {
    const request = createMockRequest();
    const reply = createMockReply();

    errorHandler(new FormTemplateNotFoundError(5), request, reply);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({
      success: 0,
      data: { code: ERROR_CODE.FORM_TEMPLATE_NOT_FOUND, message: expect.any(String) as string },
    });
    expect(request.log.error).not.toHaveBeenCalled();
  });

  it('should return 400 for ContactValidationError without logging', () => {
    const request = createMockRequest();
    const reply = createMockReply();

    errorHandler(new ContactValidationError('Name cannot be empty'), request, reply);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({
      success: 0,
      data: { code: ERROR_CODE.CONTACT_VALIDATION_ERROR, message: 'Name cannot be empty' },
    });
    expect(request.log.error).not.toHaveBeenCalled();
  });

  it('should return 400 for FormFieldValidationError with errors array', () => {
    const request = createMockRequest();
    const reply = createMockReply();
    const fieldErrors = ["Field 'name' is required"];

    errorHandler(new FormFieldValidationError(fieldErrors), request, reply);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({
      success: 0,
      data: { code: ERROR_CODE.FORM_FIELD_VALIDATION_ERROR, message: expect.any(String) as string, details: fieldErrors },
    });
    expect(request.log.error).not.toHaveBeenCalled();
  });

  it('should return 400 for InvalidStatusTransitionError without logging', () => {
    const request = createMockRequest();
    const reply = createMockReply();

    errorHandler(new InvalidStatusTransitionError('new', 'closed'), request, reply);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({
      success: 0,
      data: { code: ERROR_CODE.INVALID_STATUS_TRANSITION, message: expect.any(String) as string },
    });
    expect(request.log.error).not.toHaveBeenCalled();
  });

  it('should return 400 for ZodError without logging', () => {
    const request = createMockRequest();
    const reply = createMockReply();

    errorHandler(new z.ZodError([]), request, reply);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({
      success: 0,
      data: { code: ERROR_CODE.VALIDATION_ERROR, message: 'Validation error', details: [] },
    });
    expect(request.log.error).not.toHaveBeenCalled();
  });

  it('should log and return 500 for unexpected errors', () => {
    const request = createMockRequest();
    const reply = createMockReply();
    const error = new Error('unexpected');

    errorHandler(error, request, reply);

    expect(request.log.error).toHaveBeenCalledWith({ err: error }, 'Unexpected error');
    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({
      success: 0,
      data: { code: ERROR_CODE.INTERNAL_SERVER_ERROR, message: 'Internal server error' },
    });
  });
});
