/**
 * @module contact-authorization-service
 * @description Driven Port — 問い合わせ認可サービスインターフェース。
 *
 * Domain 層が「認可判定に何を求めるか」を定義するインターフェース。
 * 具体的な認可基盤（OpenFGA 等）には一切依存しない。
 *
 * @see {@link file://../infrastructure/openfga-contact-authorization-service.ts} Driven Adapter（OpenFGA 実装）
 */

export interface ContactAuthorizationService {
  canView(userId: string, contactId: number): Promise<boolean>;
  canEdit(userId: string, contactId: number): Promise<boolean>;
  canDelete(userId: string, contactId: number): Promise<boolean>;
  listViewableContactIds(userId: string): Promise<number[]>;
  grantOwnership(userId: string, contactId: number): Promise<void>;
  revokeOwnership(userId: string, contactId: number): Promise<void>;
}
