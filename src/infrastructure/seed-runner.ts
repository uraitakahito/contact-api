/**
 * @module seed-runner
 * @description Infrastructure — 宣言的シードランナー。
 *
 * SeedDefinition と CSV ファイルから Kysely クエリビルダで
 * シードデータを投入する汎用ランナー。DB 固有の SQL を使わないため、
 * PostgreSQL 以外のデータベースでも動作する。
 */

import path from 'node:path';
import type { Kysely } from 'kysely';
import { readCsv } from './csv-reader.js';

/** CSV 列 → Kysely プロパティの変換定義 */
export interface ColumnMapping {
  /** Kysely の値オブジェクトのキー名 (camelCase) */
  readonly property: string;
  /** CSV の文字列値を適切な型に変換する関数 */
  readonly convert: (value: string) => unknown;
}

/** シードデータの宣言的定義 */
export interface SeedDefinition {
  /** Kysely テーブル名 (camelCase — CamelCasePlugin が snake_case に変換) */
  readonly tableName: string;
  /** CSV ファイルパス (process.cwd() からの相対パス) */
  readonly csvPath: string;
  /** CSV ヘッダ名 → ColumnMapping の対応。キーは CSV のヘッダ名 (snake_case) */
  readonly columns: Readonly<Record<string, ColumnMapping>>;
}

/**
 * CSV を読み込み、SeedDefinition に従ってデータを投入する。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely の Migrator が Migration.up に Kysely<any> を渡すため
export async function runSeed(db: Kysely<any>, definition: SeedDefinition): Promise<void> {
  const absolutePath = path.resolve(process.cwd(), definition.csvPath);
  const rawRows = await readCsv(absolutePath);

  if (rawRows.length === 0) {
    return;
  }

  const rows = rawRows.map((raw) => {
    const converted: Record<string, unknown> = {};
    for (const [csvColumn, mapping] of Object.entries(definition.columns)) {
      const value = raw[csvColumn];
      if (value === undefined) {
        throw new Error(`CSV column "${csvColumn}" not found in ${definition.csvPath}`);
      }
      converted[mapping.property] = mapping.convert(value);
    }
    return converted;
  });

  await db.insertInto(definition.tableName).values(rows).execute();
}

/**
 * SeedDefinition に対応するテーブルの全データを削除する。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kysely の Migrator が Migration.down に Kysely<any> を渡すため
export async function revertSeed(db: Kysely<any>, definition: SeedDefinition): Promise<void> {
  await db.deleteFrom(definition.tableName).execute();
}
