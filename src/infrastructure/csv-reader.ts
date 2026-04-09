/**
 * @module csv-reader
 * @description Infrastructure — 最小限の CSV パーサ。
 *
 * 外部ライブラリに依存せず、開発者が管理するシード CSV を読み取る。
 * RFC 4180 のサブセット（ダブルクォート、エスケープ、CRLF）に対応。
 */

import { promises as fs } from 'node:fs';

/**
 * CSV ファイルを読み込み、ヘッダ名をキーとした Record 配列を返す。
 *
 * @param filePath - CSV ファイルの絶対パス
 * @returns 各行をヘッダ名 → 値の Record にマッピングした配列
 */
export async function readCsv(filePath: string): Promise<Record<string, string>[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const rows = parseRows(content);

  const headers = rows[0];
  if (!headers) {
    return [];
  }

  const dataRows = rows.slice(1);

  return dataRows.map((row) => {
    const record: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      const key = headers[i];
      if (key !== undefined) {
        record[key] = row[i] ?? '';
      }
    }
    return record;
  });
}

/**
 * CSV テキストを 2 次元配列にパースする。
 * ダブルクォートで囲まれたフィールド内のカンマ・改行・エスケープ ("") に対応。
 */
function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let field = '';
  // eslint-disable-next-line @typescript-eslint/naming-convention -- 標準的な boolean 命名
  let isInsideQuote = false;
  let i = 0;

  while (i < text.length) {
    const char = text.charAt(i);

    if (isInsideQuote) {
      if (char === '"') {
        if (i + 1 < text.length && text.charAt(i + 1) === '"') {
          // エスケープされたダブルクォート ("" → ")
          field += '"';
          i += 2;
        } else {
          // クォート終了
          isInsideQuote = false;
          i++;
        }
      } else {
        field += char;
        i++;
      }
    } else if (char === '"') {
      isInsideQuote = true;
      i++;
    } else if (char === ',') {
      currentRow.push(field);
      field = '';
      i++;
    } else if (char === '\r') {
      // CRLF or CR
      currentRow.push(field);
      field = '';
      if (!isEmptyRow(currentRow)) {
        rows.push(currentRow);
      }
      currentRow = [];
      i += (i + 1 < text.length && text.charAt(i + 1) === '\n') ? 2 : 1;
    } else if (char === '\n') {
      currentRow.push(field);
      field = '';
      if (!isEmptyRow(currentRow)) {
        rows.push(currentRow);
      }
      currentRow = [];
      i++;
    } else {
      field += char;
      i++;
    }
  }

  // 最終行（改行で終わらない場合）
  if (field !== '' || currentRow.length > 0) {
    currentRow.push(field);
    if (!isEmptyRow(currentRow)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/** 空行判定: フィールドが 1 つだけで中身が空文字列 */
function isEmptyRow(row: string[]): boolean {
  return row.length === 1 && row[0] === '';
}
