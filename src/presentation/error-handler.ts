/**
 * @module error-handler
 * @description Driving Adapter 補助 — ドメインエラーを HTTP レスポンスに変換するエラーハンドラ。
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod/v4';
import { AuthorizationError, ContactNotFoundError, ContactValidationError, FormFieldValidationError, FormTemplateNotFoundError, InvalidStatusTransitionError } from '../domain/errors.js';

export function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof AuthorizationError) {
    void reply.status(403).send({ error: error.message });
    return;
  }

  if (error instanceof ContactNotFoundError) {
    void reply.status(404).send({ error: error.message });
    return;
  }

  if (error instanceof FormTemplateNotFoundError) {
    void reply.status(400).send({ error: error.message });
    return;
  }

  if (error instanceof ContactValidationError) {
    void reply.status(400).send({ error: error.message });
    return;
  }

  if (error instanceof FormFieldValidationError) {
    void reply.status(400).send({ error: error.message, details: error.errors });
    return;
  }

  if (error instanceof InvalidStatusTransitionError) {
    void reply.status(400).send({ error: error.message });
    return;
  }

  if (error instanceof z.ZodError) {
    void reply.status(400).send({
      error: 'Validation error',
      details: error.issues,
    });
    return;
  }

  request.log.error({ err: error }, 'Unexpected error');
  void reply.status(500).send({ error: 'Internal server error' });
}
