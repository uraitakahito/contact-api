# Contact API

## アーキテクチャ

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│   (Fastify Routes, Zod Schemas)         │
│   HTTP リクエスト/レスポンスの処理          │
├─────────────────────────────────────────┤
│           Application Layer             │
│   (Use Cases)                           │
│   ビジネスロジックのオーケストレーション      │
├─────────────────────────────────────────┤
│            Domain Layer                 │
│   (Entities, Repository Interface)      │
│   ビジネスルール、外部依存なし              │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│   (Kysely Repository, DB Connection)    │
│   データベースアクセスの具体的な実装         │
└─────────────────────────────────────────┘
```

**依存の方向**: Presentation → Application → Domain ← Infrastructure

Domain 層は外部ライブラリに一切依存しません。Infrastructure 層が Domain 層の Repository インターフェースを実装します（依存性逆転の原則）。

## セットアップ

### 起動手順

```bash
./setup.sh
docker compose --profile dev up -d
```

以降は dev コンテナ内で実行

```bash
npm install
npm run build
npm run migrate
npm run seed
npm start
```

## API エンドポイント

### 問い合わせ種別一覧取得

```bash
curl -s "http://localhost:3000/contact-categories?locale=ja" | jq
```

レスポンス例:

```json
[
  { "id": 1, "name": "一般的なお問合せ", "displayOrder": 1, "createdAt": "2026-04-08T12:00:00.000Z", "updatedAt": "2026-04-08T12:00:00.000Z" },
  { "id": 2, "name": "製品/サービスについて", "displayOrder": 2, "createdAt": "2026-04-08T12:00:00.000Z", "updatedAt": "2026-04-08T12:00:00.000Z" },
  { "id": 3, "name": "採用について", "displayOrder": 3, "createdAt": "2026-04-08T12:00:00.000Z", "updatedAt": "2026-04-08T12:00:00.000Z" },
  { "id": 4, "name": "その他", "displayOrder": 4, "createdAt": "2026-04-08T12:00:00.000Z", "updatedAt": "2026-04-08T12:00:00.000Z" }
]
```

### 問い合わせ作成

```bash
curl -s -X POST http://localhost:3000/contacts \
  -H "Content-Type: application/json" \
  -d '{"lastName": "山田", "firstName": "太郎", "email": "yamada@example.com", "phone": "090-1234-5678", "categoryId": 1, "message": "詳細を教えてください"}' | jq
```

レスポンス:
```json
{
  "id": 1,
  "lastName": "山田",
  "firstName": "太郎",
  "email": "yamada@example.com",
  "phone": "090-1234-5678",
  "categoryId": 1,
  "message": "詳細を教えてください",
  "status": "new",
  "createdAt": "2026-04-08T12:00:00.000Z",
  "updatedAt": "2026-04-08T12:00:00.000Z"
}
```

### 問い合わせ一覧取得

```bash
# 全件取得
curl -s http://localhost:3000/contacts | jq

# ステータスでフィルタ
curl -s "http://localhost:3000/contacts?status=new" | jq
```

### 問い合わせ個別取得

```bash
curl -s http://localhost:3000/contacts/1 | jq
```

### 問い合わせステータス更新

```bash
curl -s -X PATCH http://localhost:3000/contacts/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}' | jq
```

### 問い合わせ削除

```bash
curl -s -X DELETE http://localhost:3000/contacts/1 -w "\nHTTP Status: %{http_code}\n"
```

## エラーレスポンス

| HTTP Status | 説明 |
|-------------|------|
| 400 | バリデーションエラー（空の姓/名、不正なメールアドレス、不正な ID、存在しない問い合わせ種別、不正なステータス遷移など） |
| 404 | 指定された問い合わせが見つからない |
| 500 | 内部サーバーエラー |

```bash
# 400 の例: 不正なメールアドレス
curl -s -X POST http://localhost:3000/contacts \
  -H "Content-Type: application/json" \
  -d '{"lastName": "Test", "firstName": "User", "email": "bad", "categoryId": 1, "message": "Msg"}' | jq

# 400 の例: 存在しない問い合わせ種別
curl -s -X POST http://localhost:3000/contacts \
  -H "Content-Type: application/json" \
  -d '{"lastName": "Test", "firstName": "User", "email": "test@example.com", "categoryId": 999, "message": "Msg"}' | jq

# 404 の例: 存在しない ID
curl -s http://localhost:3000/contacts/999 | jq
```

## シードデータ

マイグレーションはスキーマ定義のみを管理し、初期データ（シード）は別途管理します。

```bash
# シードデータ投入
npm run seed

# シードデータ取り消し
npm run seed:down
```

シードの適用状態は `kysely_seed` テーブルで追跡され、スキーマ用の `kysely_migration` テーブルとは独立しています。

## テスト

```bash
npm test
```

## ヘキサゴナルアーキテクチャ（Ports and Adapters）

本プロジェクトは DDD のレイヤードアーキテクチャに、ヘキサゴナルアーキテクチャの考え方を取り入れています。アプリケーションのコアロジックを外部の技術的詳細（HTTP、データベース）から分離し、Port（インターフェース）と Adapter（実装）で接続します。

```
[HTTP Client]
     │
     ▼  Driving Adapter
contact-routes.ts (Fastify)
     │
     ▼  Driving Port
CreateContactUseCase.execute()
     │
     ▼  Driven Port
ContactRepository.create()          ← インターフェース（Domain層）
     │
     ▼  Driven Adapter
KyselyContactRepository.create()    ← 実装（Infrastructure層）
     │
     ▼
  PostgreSQL
```

### Port と Adapter の対応表

| 種類 | 方向 | 役割 | ファイル |
|---|---|---|---|
| **Driving Port** | 外 → 内 | 外部がアプリケーションを駆動する入り口 | `src/application/create-contact.ts` 等 6 ユースケース |
| **Driving Adapter** | 外 → 内 | HTTP リクエストをユースケースに橋渡し | `src/presentation/contact-routes.ts`, `health-routes.ts` |
| **Driving Adapter 補助** | 外 → 内 | バリデーション・フォーマット・エラー変換 | `src/presentation/schemas.ts`, `format.ts`, `error-handler.ts` |
| **Driven Port** | 内 → 外 | アプリケーションが外部を利用するインターフェース | `src/domain/contact-repository.ts`, `contact-category-repository.ts` |
| **Driven Adapter** | 内 → 外 | Driven Port の具体的な DB 実装 | `src/infrastructure/kysely-contact-repository.ts`, `kysely-contact-category-repository.ts` |
| **Domain Model** | — | ビジネスの中心概念（外部依存なし） | `src/domain/contact.ts`, `contact-category.ts`, `errors.ts` |
| **Composition Root** | — | Port と Adapter を結合し依存性を注入 | `src/bin/server.ts` |

### 依存性逆転の原則（DIP）

Domain 層が `ContactRepository` インターフェース（Driven Port）を定義し、Infrastructure 層の `KyselyContactRepository`（Driven Adapter）が実装します。これにより Domain 層・Application 層は具体的な DB 技術を知らず、Adapter の差し替えだけで技術を変更できます。

## DDD 各層の説明

### Domain 層 (`src/domain/`)

- `contact.ts` - Contact エンティティの型定義（姓/名分離）
- `contact-category.ts` - ContactCategory エンティティの型定義（問い合わせ種別）
- `contact-repository.ts` - ContactRepository インターフェース（Port）
- `contact-category-repository.ts` - ContactCategoryRepository インターフェース（Port）
- `errors.ts` - ドメイン固有のエラークラス

外部ライブラリへの依存なし。純粋な TypeScript の型とクラスのみ。

### Application 層 (`src/application/`)

- 各ユースケースが 1 ファイル 1 クラス
- コンストラクタで Repository インターフェースを受け取る（DI）
- Domain 層のみに依存

### Infrastructure 層 (`src/infrastructure/`)

- `connection.ts` - Kysely DB 接続ファクトリ
- `database.ts` - Kysely 用のテーブル型定義
- `kysely-contact-repository.ts` - `ContactRepository` の Kysely 実装（Adapter）
- `kysely-contact-category-repository.ts` - `ContactCategoryRepository` の Kysely 実装（Adapter）
- `migrations/` - データベースマイグレーション

Domain 層の Repository インターフェースを実装（依存性逆転）。

### Presentation 層 (`src/presentation/`)

- `contact-routes.ts` - Fastify ルート定義
- `health-routes.ts` - ヘルスチェックルート（`/health/live`, `/health/ready`）
- `schemas.ts` - Zod バリデーションスキーマ
- `error-handler.ts` - ドメインエラー → HTTP レスポンス変換
- `format.ts` - Contact エンティティ → JSON レスポンス変換

### Composition Root (`src/bin/server.ts`)

全層を組み立てるエントリーポイント。DI コンテナの役割を果たす。

## ログ

[pino](https://github.com/pinojs/pino) による構造化 JSON ログを出力します。

### ログレベル

環境変数 `LOG_LEVEL` で制御します（デフォルト: `info`）。

| レベル | 用途 |
|--------|------|
| `fatal` | プロセス続行不能なエラー |
| `error` | エラー |
| `warn` | 警告 |
| `info` | 通常の動作情報（デフォルト） |
| `debug` | デバッグ情報（SQL クエリ等） |
| `trace` | 詳細トレース |
| `silent` | ログ出力なし（テスト用） |

CLI の `--verbose` フラグは `LOG_LEVEL=debug` と同等です。

### 開発時の人間向け出力

`pino-pretty` をパイプで使用します。`npm run dev` / `npm run migrate` 等の開発用スクリプトには組み込み済みです。

```bash
# 手動で使う場合
npm start | pino-pretty
```

## 本番ビルド

```bash
docker compose --profile prod up -d
```

Multi-stage ビルドで distroless イメージを使用した軽量な本番コンテナが起動します。
