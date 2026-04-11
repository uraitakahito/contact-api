/**
 * @module logger
 * @description Infrastructure — 一元化されたロガーモジュール。
 *
 * pino のルートロガーシングルトンと、コンテキスト付き子ロガー生成ファクトリを提供する。
 * ログレベルは環境変数 LOG_LEVEL で制御（デフォルト: info）。
 */

import pino from 'pino';

export type Logger = pino.Logger;
export type LoggerBindings = pino.Bindings;

export const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
});

export const createChildLogger = (bindings: LoggerBindings): Logger => {
  return logger.child(bindings);
};

/**
 * CLIエントリーポイント用の初期化関数。
 * ルートロガーのレベル設定と子ロガー生成を不可分操作として行う。
 */
export function initializeCliLogger(level: string, bindings: LoggerBindings): Logger {
  logger.level = level;
  return logger.child(bindings);
}
