/**
 * @module migrator-definitions
 * @description Infrastructure — マイグレーション / シードの宣言的設定。
 *
 * 各コマンドの設定をデータとして定義する。ロジックは持たない。
 */

export interface MigratorDefinition {
  /** マイグレーションファイルのディレクトリ (file: URL) */
  readonly folder: URL;
  /** Kysely の管理テーブル名 */
  readonly tableName: string;
  /** Kysely のロックテーブル名 */
  readonly lockTableName: string;
  /** ログ出力用ラベル */
  readonly label: string;
}

export const migratorDefinitions: Record<string, MigratorDefinition> = {
  // NOTE: 'kysely_migration' は Kysely Migrator のデフォルトテーブル名に由来する
  migrate: { folder: new URL('./migrations', import.meta.url), tableName: 'kysely_migration', lockTableName: 'kysely_migration_lock', label: 'Migration' },
  seed: { folder: new URL('./seeds', import.meta.url), tableName: 'kysely_seed', lockTableName: 'kysely_seed_lock', label: 'Seed' },
};
