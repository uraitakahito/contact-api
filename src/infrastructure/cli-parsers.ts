/**
 * @module cli-parsers
 * @description Infrastructure — Commander argParser ヘルパー。
 *
 * CLI オプションの型変換とバリデーションを parse 時に行う共通ユーティリティ。
 */

import { InvalidArgumentError } from 'commander';

export function parsePort(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
    throw new InvalidArgumentError(`"${value}" is not a valid port number (0–65535).`);
  }
  return parsed;
}
