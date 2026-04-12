# Contact API

## 特徴

- 問い合わせフォームを実装するための API サーバー
- 動的フォームテンプレート — フォームの項目構成をテンプレートとして DB に保存し、複数種類のフォームを管理可能。フィールドごとにバリデーション種別（メールアドレス・電話番号・URL）を設定可能
- OpenFGA による関係ベースアクセス制御（ReBAC）。OpenFGA を Policy Decision Point（PDP）として認可判断を委譲
- 多言語対応（i18n）
- マルチテナント(未実装)

## 本番環境の起動

```bash
./setup.sh
docker compose --env-file .env.prod --profile prod up -d
```

初回起動時は init サービスが自動的に以下を実行します:

1. `prod-migrate` — データベースマイグレーション
2. `prod-seed` — シードデータ投入
3. `prod-openfga-setup` — OpenFGA Store/認可モデル作成

すべての init サービスが完了した後、API サーバーが起動します。

## 開発環境のセットアップ

### 起動手順

```bash
./setup.sh
docker compose --env-file .env.dev --profile dev up -d
```

以降は dev コンテナ内で実行

```bash
npm install
npm run build
npm run migrate
npm run seed
npm run openfga:setup
```

`npm run openfga:setup` が出力する `OPENFGA_STORE_ID` と `OPENFGA_AUTH_MODEL_ID` を環境変数に設定してサーバーを起動します。

```bash
# 方法1: eval でワンライナーで環境変数をセット（ログは stderr に出力される）
eval $(node dist/src/bin/setup-openfga.js)
npm start

# 方法2: 手動で環境変数を指定
OPENFGA_STORE_ID=xxxxx OPENFGA_AUTH_MODEL_ID=yyyyy npm start
```

`.env` に設定してコンテナを再起動する方法でも問題ありません。

## 認可 (OpenFGA)

[docs/authorization.md](docs/authorization.md) を参照。認可モデルの定義は [data/openfga/model.fga](data/openfga/model.fga) にあります。

## API エンドポイント

[docs/api-endpoints.md](docs/api-endpoints.md) を参照。

## エラーレスポンス

[docs/error-responses.md](docs/error-responses.md) を参照。

## アーキテクチャ

[docs/architecture.md](docs/architecture.md) を参照。
