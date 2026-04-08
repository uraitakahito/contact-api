/**
 * @module database
 * @description Infrastructure — Kysely 用のテーブル型定義。
 *
 * DBスキーマと TypeScript 型のマッピング。
 */

import type { ColumnType, Generated } from 'kysely';

export interface ContactTable {
  id: Generated<number>;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ColumnType<string, string | undefined, string>;
  createdAt: ColumnType<Date, string | undefined, never>;
  updatedAt: ColumnType<Date, string | undefined, string>;
}

export interface Database {
  contacts: ContactTable;
}
