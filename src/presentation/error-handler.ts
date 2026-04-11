/**
 * @module error-handler
 * @description Driving Adapter 補助 — ドメインエラーを HTTP レスポンスに変換するエラーハンドラ。
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod/v4';
import { AuthorizationError, ContactNotFoundError, ContactValidationError, FormFieldValidationError, FormTemplateNotFoundError, InvalidStatusTransitionError } from '../domain/errors.js';
import { ERROR_CODE, wrapError } from './envelope.js';
import type { ValidationMessageFormatter } from './validation-message-formatter.js';

function extractLocale(request: FastifyRequest): string {
  const query = request.query as Record<string, unknown>;
  const locale = query['locale'];
  return typeof locale === 'string' && locale.length > 0 ? locale : 'en';
}

export function createErrorHandler(
  formatter: ValidationMessageFormatter,
): (error: Error, request: FastifyRequest, reply: FastifyReply) => void {
  return function errorHandler(
    error: Error,
    request: FastifyRequest,
    reply: FastifyReply,
  ): void {
    if (error instanceof AuthorizationError) {
      void reply.status(403).send(wrapError(ERROR_CODE.AUTHORIZATION_ERROR, error.message));
      return;
    }

    if (error instanceof ContactNotFoundError) {
      void reply.status(404).send(wrapError(ERROR_CODE.CONTACT_NOT_FOUND, error.message));
      return;
    }

    if (error instanceof FormTemplateNotFoundError) {
      void reply.status(400).send(wrapError(ERROR_CODE.FORM_TEMPLATE_NOT_FOUND, error.message));
      return;
    }

    if (error instanceof ContactValidationError) {
      void reply.status(400).send(wrapError(ERROR_CODE.CONTACT_VALIDATION_ERROR, error.message));
      return;
    }

    if (error instanceof FormFieldValidationError) {
      const locale = extractLocale(request);
      const details = formatter.format(error.errors, locale);
      void reply.status(400).send(wrapError(ERROR_CODE.FORM_FIELD_VALIDATION_ERROR, error.message, details));
      return;
    }

    if (error instanceof InvalidStatusTransitionError) {
      void reply.status(400).send(wrapError(ERROR_CODE.INVALID_STATUS_TRANSITION, error.message));
      return;
    }

    if (error instanceof z.ZodError) {
      void reply.status(400).send(wrapError(ERROR_CODE.VALIDATION_ERROR, 'Validation error', error.issues));
      return;
    }

    request.log.error({ err: error }, 'Unexpected error');
    void reply.status(500).send(wrapError(ERROR_CODE.INTERNAL_SERVER_ERROR, 'Internal server error'));
  };
}
