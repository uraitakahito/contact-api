/**
 * @module validation-message-repository
 * @description Driven Port — バリデーションメッセージテンプレートの取得インターフェース。
 *
 * Domain 層が「バリデーションメッセージの取得に何を求めるか」を定義するインターフェース。
 *
 * @see {@link file://../infrastructure/kysely-validation-message-repository.ts} Driven Adapter（Kysely 実装）
 */

/** code → locale → テンプレート文字列 */
export interface ValidationMessageRepository {
  findAll(): Promise<Map<string, Map<string, string>>>;
}
