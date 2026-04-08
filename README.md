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
npm start
```

## API エンドポイント

### ヘルスチェック

```bash
# Liveness: プロセスが生きているか
curl -s http://localhost:3000/health/live | jq

# Readiness: DB に接続できるか
curl -s http://localhost:3000/health/ready | jq
```

### 問い合わせ作成

```bash
curl -s -X POST http://localhost:3000/contacts \
  -H "Content-Type: application/json" \
  -d '{"name": "山田太郎", "email": "yamada@example.com", "phone": "090-1234-5678", "subject": "サービスについて", "message": "詳細を教えてください"}' | jq
```

レスポンス:
```json
{
  "id": 1,
  "name": "山田太郎",
  "email": "yamada@example.com",
  "phone": "090-1234-5678",
  "subject": "サービスについて",
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
curl -s "http://localhost:3000/contacts?status=in_progress" | jq
curl -s "http://localhost:3000/contacts?status=resolved" | jq
curl -s "http://localhost:3000/contacts?status=closed" | jq
```

### 問い合わせ個別取得

```bash
curl -s http://localhost:3000/contacts/1 | jq
```

### 問い合わせ更新

```bash
# ステータス変更
curl -s -X PUT http://localhost:3000/contacts/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}' | jq

# 内容の修正
curl -s -X PUT http://localhost:3000/contacts/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "山田太郎（更新）", "subject": "料金について"}' | jq
```

### 問い合わせ削除

```bash
curl -s -X DELETE http://localhost:3000/contacts/1 -w "\nHTTP Status: %{http_code}\n"
```

## エラーレスポンス

| HTTP Status | 説明 |
|-------------|------|
| 400 | バリデーションエラー（空の氏名、不正なメールアドレス、不正な ID など） |
| 404 | 指定された問い合わせが見つからない |
| 500 | 内部サーバーエラー |

```bash
# 400 の例: 不正なメールアドレス
curl -s -X POST http://localhost:3000/contacts \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "email": "bad", "subject": "Sub", "message": "Msg"}' | jq

# 404 の例: 存在しない ID
curl -s http://localhost:3000/contacts/999 | jq
```

## テスト

```bash
# 全テスト実行
npm test

# Unit テスト（ドメイン層 + アプリケーション層、DB 不要）
npm run test:unit

# DB テスト（インフラ層 + プレゼンテーション層、PostgreSQL 必要）
npm run test:db
```

## DDD 各層の説明

### Domain 層 (`src/domain/`)

- `contact.ts` - Contact エンティティの型定義
- `contact-repository.ts` - Repository インターフェース（Port）
- `errors.ts` - ドメイン固有のエラークラス

外部ライブラリへの依存なし。純粋な TypeScript の型とクラスのみ。

### Application 層 (`src/application/`)

- 各ユースケースが 1 ファイル 1 クラス
- コンストラクタで `ContactRepository` インターフェースを受け取る（DI）
- Domain 層のみに依存

### Infrastructure 層 (`src/infrastructure/`)

- `connection.ts` - Kysely DB 接続ファクトリ
- `database.ts` - Kysely 用のテーブル型定義
- `kysely-contact-repository.ts` - `ContactRepository` の Kysely 実装（Adapter）
- `migrations/` - データベースマイグレーション

Domain 層の `ContactRepository` インターフェースを実装（依存性逆転）。

### Presentation 層 (`src/presentation/`)

- `contact-routes.ts` - Fastify ルート定義
- `health-routes.ts` - ヘルスチェックルート（`/health/live`, `/health/ready`）
- `schemas.ts` - Zod バリデーションスキーマ
- `error-handler.ts` - ドメインエラー → HTTP レスポンス変換
- `format.ts` - Contact エンティティ → JSON レスポンス変換

### Composition Root (`src/main.ts`)

全層を組み立てるエントリーポイント。DI コンテナの役割を果たす。

## 本番ビルド

```bash
docker compose --profile prod up -d
```

Multi-stage ビルドで distroless イメージを使用した軽量な本番コンテナが起動します。
