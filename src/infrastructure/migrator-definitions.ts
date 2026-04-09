/**
 * @module migrator-definitions
 * @description Infrastructure — マイグレーション / シードの宣言的設定。
 *
 * 各コマンドの設定をデータとして定義する。ロジックは持たない。
 */

export interface MigratorDefinition {
  /** サブフォルダ名 (infrastructure/ からの相対) */
  readonly folder: string;
  /** Kysely の管理テーブル名 (省略時: デフォルト kysely_migration) */
  readonly tableName?: string | undefined;
  /** ログ出力用ラベル */
  readonly label: string;
}

export const migratorDefinitions: Record<string, MigratorDefinition> = {
  migrate: { folder: 'migrations', label: 'Migration' },
  seed: { folder: 'seeds', tableName: 'kysely_seed', label: 'Seed' },
};
