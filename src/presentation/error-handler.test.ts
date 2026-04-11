import { describe, expect, it, vi } from 'vitest';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod/v4';
import { AuthorizationError, ContactNotFoundError, ContactValidationError, FormFieldValidationError, FormTemplateNotFoundError, InvalidStatusTransitionError } from '../domain/errors.js';
import type { FieldValidationError } from '../domain/form-template.js';
import { ERROR_CODE } from './envelope.js';
import { createErrorHandler } from './error-handler.js';
import { ValidationMessageFormatter } from './validation-message-formatter.js';

function createTestTemplates(): Map<string, Map<string, string>> {
  return new Map([
    ['required', new Map([['ja', '{label}は必須です'], ['en', '{label} is required']])],
    ['invalid_format', new Map([['ja', '{label}の{format}形式が正しくありません'], ['en', '{label} has invalid {format} format']])],
  ]);
}

function createMockRequest(query: Record<string, unknown> = {}): FastifyRequest {
  return { log: { error: vi.fn() }, query } as unknown as FastifyRequest;
}

function createMockReply() {
  const reply = { status: vi.fn(), send: vi.fn() } as unknown as FastifyReply;
  vi.mocked(reply.status).mockReturnValue(reply);
  return reply;
}

const formatter = new ValidationMessageFormatter(createTestTemplates());
const errorHandler = createErrorHandler(formatter);

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

  it('should return 400 for FormFieldValidationError with localized details', () => {
    const request = createMockRequest({ locale: 'ja' });
    const reply = createMockReply();
    const fieldErrors: FieldValidationError[] = [
      { field: 'name', code: 'required', params: {}, labels: new Map([['ja', '名前'], ['en', 'Name']]) },
    ];

    errorHandler(new FormFieldValidationError(fieldErrors), request, reply);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({
      success: 0,
      data: {
        code: ERROR_CODE.FORM_FIELD_VALIDATION_ERROR,
        message: expect.any(String) as string,
        details: [{ field: 'name', code: 'required', message: '名前は必須です' }],
      },
    });
    expect(request.log.error).not.toHaveBeenCalled();
  });

  it('should default to English locale when locale query is absent', () => {
    const request = createMockRequest();
    const reply = createMockReply();
    const fieldErrors: FieldValidationError[] = [
      { field: 'name', code: 'required', params: {}, labels: new Map([['ja', '名前'], ['en', 'Name']]) },
    ];

    errorHandler(new FormFieldValidationError(fieldErrors), request, reply);

    expect(reply.send).toHaveBeenCalledWith({
      success: 0,
      data: {
        code: ERROR_CODE.FORM_FIELD_VALIDATION_ERROR,
        message: expect.any(String) as string,
        details: [{ field: 'name', code: 'required', message: 'Name is required' }],
      },
    });
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
