/**
 * @module form-template-routes
 * @description Driving Adapter
 *
 * フォームテンプレートの HTTP ルート定義。
 * テンプレートの参照は公開、管理操作は認証（X-User-Id）のみ必要。
 */

import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { CreateFormTemplateUseCase } from '../application/create-form-template.js';
import type { DeleteFormTemplateUseCase } from '../application/delete-form-template.js';
import type { GetFormTemplateByIdUseCase } from '../application/get-form-template-by-id.js';
import type { GetFormTemplatesUseCase } from '../application/get-form-templates.js';
import type { UpdateFormTemplateUseCase } from '../application/update-form-template.js';
import type { CreateFormFieldInput, FormFieldOption } from '../domain/form-template.js';
import { ERROR_CODE, wrapError, wrapSuccess } from './envelope.js';
import { formatFormTemplate, formatFormTemplates } from './format.js';
import {
  createFormTemplateBodySchema,
  formTemplatesQuerySchema,
  templateIdParamSchema,
  updateFormTemplateBodySchema,
} from './schemas.js';

export interface FormTemplateUseCases {
  createFormTemplate: CreateFormTemplateUseCase;
  getFormTemplates: GetFormTemplatesUseCase;
  getFormTemplateById: GetFormTemplateByIdUseCase;
  updateFormTemplate: UpdateFormTemplateUseCase;
  deleteFormTemplate: DeleteFormTemplateUseCase;
}

function extractUserId(request: FastifyRequest): string | undefined {
  const header = request.headers['x-user-id'];
  if (typeof header === 'string' && header.length > 0) {
    return header;
  }
  return undefined;
}

/**
 * Zod パース結果の Record を Domain 層の Map ベース型に変換する。
 */
function toCreateFormFieldInputs(
  fields: {
    name: string;
    fieldType: 'text' | 'textarea' | 'select';
    validation: { type: 'none' | 'email' | 'phone' | 'url'; minLength?: number | undefined; maxLength?: number | undefined };
    isRequired: boolean;
    displayOrder: number;
    options: { value: string; labels: Record<string, string> }[];
    cssClass: string;
    htmlId: string;
    translations: Record<string, { label: string; placeholder: string; helpText: string }>;
  }[],
): CreateFormFieldInput[] {
  return fields.map((f) => ({
    name: f.name,
    fieldType: f.fieldType,
    validation: f.validation,
    isRequired: f.isRequired,
    displayOrder: f.displayOrder,
    options: f.options.map((opt): FormFieldOption => ({
      value: opt.value,
      labels: new Map(Object.entries(opt.labels)),
    })),
    cssClass: f.cssClass,
    htmlId: f.htmlId,
    translations: new Map(
      Object.entries(f.translations).map(([locale, trans]) => [locale, trans]),
    ),
  }));
}

export function registerFormTemplateRoutes(
  app: FastifyInstance,
  useCases: FormTemplateUseCases,
): void {
  // Public endpoints
  app.get('/form-templates', async (request) => {
    const query = formTemplatesQuerySchema.parse(request.query);
    const templates = await useCases.getFormTemplates.execute();
    return wrapSuccess(formatFormTemplates(templates, query.locale));
  });

  app.get('/form-templates/:id', async (request) => {
    const query = formTemplatesQuerySchema.parse(request.query);
    const params = templateIdParamSchema.parse(request.params);
    const template = await useCases.getFormTemplateById.execute(params.id);
    return wrapSuccess(formatFormTemplate(template, query.locale));
  });

  // Authenticated endpoints (X-User-Id required, no authorization check)
  app.post('/form-templates', async (request, reply) => {
    const userId = extractUserId(request);
    if (!userId) {
      return reply.status(401).send(wrapError(ERROR_CODE.AUTHENTICATION_REQUIRED, 'Missing X-User-Id header'));
    }
    const body = createFormTemplateBodySchema.parse(request.body);
    const template = await useCases.createFormTemplate.execute({
      name: body.name,
      translations: new Map(Object.entries(body.translations)),
      fields: toCreateFormFieldInputs(body.fields),
    });
    const query = formTemplatesQuerySchema.parse(request.query);
    return reply.status(201).send(wrapSuccess(formatFormTemplate(template, query.locale)));
  });

  app.put('/form-templates/:id', async (request, reply) => {
    const userId = extractUserId(request);
    if (!userId) {
      return reply.status(401).send(wrapError(ERROR_CODE.AUTHENTICATION_REQUIRED, 'Missing X-User-Id header'));
    }
    const params = templateIdParamSchema.parse(request.params);
    const body = updateFormTemplateBodySchema.parse(request.body);
    const template = await useCases.updateFormTemplate.execute(params.id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.translations !== undefined ? { translations: new Map(Object.entries(body.translations)) } : {}),
      ...(body.fields !== undefined ? { fields: toCreateFormFieldInputs(body.fields) } : {}),
    });
    const query = formTemplatesQuerySchema.parse(request.query);
    return wrapSuccess(formatFormTemplate(template, query.locale));
  });

  app.delete('/form-templates/:id', async (request, reply) => {
    const userId = extractUserId(request);
    if (!userId) {
      return reply.status(401).send(wrapError(ERROR_CODE.AUTHENTICATION_REQUIRED, 'Missing X-User-Id header'));
    }
    const params = templateIdParamSchema.parse(request.params);
    await useCases.deleteFormTemplate.execute(params.id);
    return wrapSuccess(null);
  });
}
