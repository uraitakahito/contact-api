/**
 * @module contact-category
 * @description ドメインモデル — ContactCategory エンティティの型定義。
 *
 * 問い合わせ種別を表現し、外部技術に一切依存しない。
 * 翻訳は locale → name の Map で保持し、ドメインはロケール非依存。
 */

export interface ContactCategory {
  id: number;
  translations: Map<string, string>;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
