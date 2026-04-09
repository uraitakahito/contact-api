/**
 * @module contact-category
 * @description ドメインモデル — ContactCategory エンティティの型定義。
 *
 * 問い合わせ種別を表現し、外部技術に一切依存しない。
 */

export interface ContactCategory {
  id: number;
  name: string;
  displayOrder: number;
  createdAt: Date;
}
