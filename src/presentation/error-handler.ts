/**
 * @module error-handler
 * @description Driving Adapter 補助 — ドメインエラーを HTTP レスポンスに変換するエラーハンドラ。
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod/v4';
import { ContactCategoryNotFoundError, ContactNotFoundError, ContactValidationError, InvalidStatusTransitionError } from '../domain/errors.js';

export function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof ContactNotFoundError) {
    void reply.status(404).send({ error: error.message });
    return;
  }

  if (error instanceof ContactCategoryNotFoundError) {
    void reply.status(400).send({ error: error.message });
    return;
  }

  if (error instanceof ContactValidationError) {
    void reply.status(400).send({ error: error.message });
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
