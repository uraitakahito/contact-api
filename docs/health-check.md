# ヘルスチェック

Kubernetes や Docker Compose のヘルスチェックに使用できるエンドポイントです。

## エンドポイント

### Liveness: プロセスが生きているか

```bash
curl -s http://localhost:3000/health/live | jq
```

レスポンス:
```json
{ "status": "ok" }
```

### Readiness: DB に接続できるか

```bash
curl -s http://localhost:3000/health/ready | jq
```

レスポンス（正常時）:
```json
{ "status": "ok" }
```

レスポンス（DB 接続不可時、HTTP 503）:
```json
{ "status": "error", "message": "..." }
```
