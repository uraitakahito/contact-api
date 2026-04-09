/**
 * @module contact-category-repository
 * @description Driven Port（駆動されるポート） — ContactCategoryRepository インターフェース。
 *
 * Domain 層が「問い合わせ種別の永続化に何を求めるか」を定義するインターフェース。
 *
 * @see {@link file://../infrastructure/kysely-contact-category-repository.ts} Driven Adapter（Kysely 実装）
 */

import type { ContactCategory } from './contact-category.js';

export interface ContactCategoryRepository {
  findAll(): Promise<ContactCategory[]>;
  findById(id: number): Promise<ContactCategory | undefined>;
}
