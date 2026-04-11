/**
 * @module cli-parsers
 * @description Infrastructure — Commander argParser ヘルパー。
 *
 * CLI オプションの型変換とバリデーションを parse 時に行う共通ユーティリティ。
 */

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { InvalidArgumentError } from 'commander';

export function parseUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    throw new InvalidArgumentError(`"${value}" is not a valid URL.`);
  }
}

export function parsePort(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
    throw new InvalidArgumentError(`"${value}" is not a valid port number (0–65535).`);
  }
  return parsed;
}

export function parsePath(value: string): URL {
  if (value.trim() === '') {
    throw new InvalidArgumentError('Path must not be empty.');
  }
  return pathToFileURL(path.resolve(value));
}
