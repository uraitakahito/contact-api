/**
 * @module envelope
 * @description Driving Adapter 補助 — API レスポンスを標準エンベロープ形式でラップする。
 *
 * すべての API レスポンス（Health エンドポイントを除く）は { success, data } 形式に統一される。
 * フロントエンドは success フィールドだけでエラー判定できる。
 */

/** 成功レスポンスのエンベロープ */
export interface SuccessEnvelope<T> {
  success: 1;
  data: T;
}

/** エラーレスポンスの data 部分 */
export interface ErrorData {
  code: number;
  message: string;
  details?: unknown;
}

/** エラーレスポンスのエンベロープ */
export interface ErrorEnvelope {
  success: 0;
  data: ErrorData;
}

/** API レスポンスの共用体型 */
export type ApiResponse<T> = SuccessEnvelope<T> | ErrorEnvelope;

export function wrapSuccess<T>(data: T): SuccessEnvelope<T> {
  return { success: 1, data };
}

export function wrapError(code: number, message: string, details?: unknown): ErrorEnvelope {
  const data: ErrorData = { code, message };
  if (details !== undefined) {
    data.details = details;
  }
  return { success: 0, data };
}

/** API エラーコード定数 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- 定数オブジェクトは UPPER_CASE が慣習的
export const ERROR_CODE = {
  VALIDATION_ERROR: 10001,
  CONTACT_VALIDATION_ERROR: 10002,
  FORM_FIELD_VALIDATION_ERROR: 10003,
  FORM_TEMPLATE_NOT_FOUND: 10004,
  INVALID_STATUS_TRANSITION: 10005,
  AUTHENTICATION_REQUIRED: 10006,
  AUTHORIZATION_ERROR: 10007,
  CONTACT_NOT_FOUND: 10008,
  INTERNAL_SERVER_ERROR: 10009,
} as const;
