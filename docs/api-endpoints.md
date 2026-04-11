# API エンドポイント

## フォームテンプレート一覧取得

```bash
curl -s "http://localhost:3000/form-templates?locale=ja" | jq
```

## フォームテンプレート詳細取得

```bash
curl -s "http://localhost:3000/form-templates/1?locale=ja" | jq
```

## フォームテンプレート作成

```bash
curl -s -X POST http://localhost:3000/form-templates \
  -H "Content-Type: application/json" \
  -H "X-User-Id: admin" \
  -d '{"name": "feedback-form", "translations": {"ja": "フィードバック", "en": "Feedback"}, "fields": [{"name": "email", "fieldType": "text", "validationType": "email", "isRequired": true, "displayOrder": 1}, {"name": "message", "fieldType": "textarea", "isRequired": true, "displayOrder": 2}]}' | jq
```

## 問い合わせ作成

```bash
curl -s -X POST http://localhost:3000/contacts \
  -H "Content-Type: application/json" \
  -H "X-User-Id: yamada" \
  -d '{"templateId": 1, "data": {"lastName": "山田", "firstName": "太郎", "email": "yamada@example.com", "phone": "090-1234-5678", "category": "general", "message": "詳細を教えてください"}}' | jq
```

レスポンス:
```json
{
  "success": 1,
  "data": {
    "id": 1,
    "templateId": 1,
    "userId": "yamada",
    "data": {
      "lastName": "山田",
      "firstName": "太郎",
      "email": "yamada@example.com",
      "phone": "090-1234-5678",
      "category": "general",
      "message": "詳細を教えてください"
    },
    "status": "new",
    "createdAt": "2026-04-08T12:00:00.000Z",
    "updatedAt": "2026-04-08T12:00:00.000Z"
  }
}
```

バリデーションエラー時は `?locale=ja` で日本語メッセージを取得できます:

```bash
curl -s -X POST "http://localhost:3000/contacts?locale=ja" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: yamada" \
  -d '{"templateId": 1, "data": {}}' | jq
```

レスポンス:
```json
{
  "success": 0,
  "data": {
    "code": 10003,
    "message": "Form validation failed: lastName:required; firstName:required; email:required; category:required; message:required",
    "details": [
      { "field": "lastName", "code": "required", "message": "姓は必須です" },
      { "field": "firstName", "code": "required", "message": "名は必須です" },
      { "field": "email", "code": "required", "message": "メールアドレスは必須です" },
      { "field": "category", "code": "required", "message": "お問い合わせ種別は必須です" },
      { "field": "message", "code": "required", "message": "メッセージは必須です" }
    ]
  }
}
```

## 問い合わせ一覧取得

```bash
# 全件取得（認可済みのもののみ）
curl -s -H "X-User-Id: yamada" http://localhost:3000/contacts | jq

# ステータスでフィルタ
curl -s -H "X-User-Id: yamada" "http://localhost:3000/contacts?status=new" | jq

# テンプレートでフィルタ
curl -s -H "X-User-Id: yamada" "http://localhost:3000/contacts?templateId=1" | jq
```

## 問い合わせ個別取得

```bash
curl -s -H "X-User-Id: yamada" http://localhost:3000/contacts/1 | jq
```

## 問い合わせステータス更新

```bash
curl -s -X PATCH http://localhost:3000/contacts/1/status \
  -H "Content-Type: application/json" \
  -H "X-User-Id: yamada" \
  -d '{"status": "in_progress"}' | jq
```

## 問い合わせ削除

```bash
curl -s -X DELETE http://localhost:3000/contacts/1 \
  -H "X-User-Id: yamada" \
  -w "\nHTTP Status: %{http_code}\n"
```
