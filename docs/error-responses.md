# エラーレスポンス

| HTTP Status | 説明 |
|-------------|------|
| 400 | バリデーションエラー（空の姓/名、不正なメールアドレス、不正な ID、存在しない問い合わせ種別、不正なステータス遷移など） |
| 401 | `X-User-Id` ヘッダー未設定 |
| 403 | 認可エラー（該当リソースへのアクセス権なし） |
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
