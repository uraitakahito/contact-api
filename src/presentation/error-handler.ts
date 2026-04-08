import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { ContactNotFoundError, ContactValidationError } from '../domain/errors.js';

export function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof ContactNotFoundError) {
    void reply.status(404).send({ error: error.message });
    return;
  }

  if (error instanceof ContactValidationError) {
    void reply.status(400).send({ error: error.message });
    return;
  }

  if (error instanceof ZodError) {
    void reply.status(400).send({
      error: 'Validation error',
      details: error.issues,
    });
    return;
  }

  request.log.error({ err: error }, 'Unexpected error');
  void reply.status(500).send({ error: 'Internal server error' });
}
