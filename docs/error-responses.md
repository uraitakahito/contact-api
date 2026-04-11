# エラーレスポンス

| HTTP Status | 説明 |
|-------------|------|
| 400 | バリデーションエラー（空の姓/名、不正なメールアドレス、不正な ID、存在しない問い合わせ種別、不正なステータス遷移など） |
| 401 | `X-User-Id` ヘッダー未設定 |
| 403 | 認可エラー（該当リソースへのアクセス権なし） |
| 404 | 指定された問い合わせが見つからない |
| 500 | 内部サーバーエラー |

```bash
# 400 の例: フィールドバリデーションエラー（email 形式不正）
curl -s -X POST http://localhost/contacts \
  -H "Content-Type: application/json" \
  -H "X-User-Id: yamada" \
  -d '{"templateId": 1, "data": {"lastName": "山田", "firstName": "太郎", "email": "bad", "category": "general", "message": "Msg"}}' | jq

# 400 の例: 存在しないフォームテンプレート
curl -s -X POST http://localhost/contacts \
  -H "Content-Type: application/json" \
  -H "X-User-Id: yamada" \
  -d '{"templateId": 999, "data": {}}' | jq

# 401 の例: X-User-Id ヘッダー未設定
curl -s http://localhost/contacts/1 | jq

# 403 の例: 他ユーザーが作成した問い合わせへのアクセス
curl -s -H "X-User-Id: other-user" http://localhost/contacts/1 | jq
```

### バリデーションエラーの多言語化

フォームフィールドのバリデーションエラーは `?locale=` クエリパラメータで言語を指定できます（デフォルト: `en`）。メッセージテンプレートは `validation_messages` テーブルに格納されており、デプロイなしで追加・変更が可能です。

`details` 配列の各要素は以下の構造を持ちます:

| フィールド | 説明 |
|-----------|------|
| `field` | フィールド名（機械可読） |
| `code` | エラーコード（`required`, `invalid_type`, `invalid_format`, `too_short`, `too_long`, `invalid_option`） |
| `message` | ロケールに応じた人間可読メッセージ |

