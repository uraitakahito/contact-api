# 認可 (OpenFGA)

本 API は [OpenFGA](https://openfga.dev/) による Relationship-Based Access Control (ReBAC) で認可を行います。

## 認可アーキテクチャ

認可はヘキサゴナルアーキテクチャの Driven Port / Adapter パターンに従い、ドメイン層が技術に依存しない形で実装されています。

```mermaid
graph TD
    Client["HTTP Client"]
    Client -- "X-User-Id ヘッダー" --> Presentation

    subgraph Presentation["Presentation 層"]
        Routes["contact-routes.ts<br/>userId を抽出"]
    end

    Presentation -- "userId" --> Application

    subgraph Application["Application 層 — 各 UseCase（PEP）"]
        AuthzCheck["認可チェック<br/>(authz.can*)"]
        DbOp["DB 操作<br/>(repo.*)"]
        TupleOp["タプル書込/削除<br/>(authz.grant / revoke)"]
        AuthzCheck --> DbOp --> TupleOp
    end

    Application --> PortRepo & PortAuthz & PortTpl

    subgraph Domain["Domain 層 (Interface)"]
        PortRepo["ContactRepository"]
        PortAuthz["ContactAuthorizationService"]
        PortTpl["FormTemplateRepository"]
    end

    PortRepo --> AdapterRepo
    PortAuthz --> AdapterAuthz
    PortTpl --> AdapterTpl

    subgraph Infra["Infrastructure 層 (Adapter)"]
        AdapterRepo["Kysely<br/>ContactRepository"]
        AdapterAuthz["OpenFGA<br/>ContactAuthorizationService"]
        AdapterTpl["Kysely<br/>FormTemplateRepository"]
    end

    AdapterRepo --> PostgreSQL1[("PostgreSQL")]
    AdapterAuthz --> OpenFGA[("OpenFGA")]
    AdapterTpl --> PostgreSQL2[("PostgreSQL")]
```

**設計のポイント:**

- **Driven Port（`ContactAuthorizationService`）** はドメイン層に定義されたインターフェースで、`canView` / `canEdit` / `canDelete` / `listViewableContactIds` / `grantOwnership` / `revokeOwnership` というドメイン用語のメソッドを持つ。OpenFGA の概念（relation, tuple, object）はドメイン層に漏れない
- **Driven Adapter（`OpenFgaContactAuthorizationService`）** がインフラ層でこのインターフェースを実装し、OpenFGA SDK への API 呼び出しに変換する
- **テスト用 Adapter（`InMemoryContactAuthorizationService`）** は `Set<string>` でタプルを管理するインメモリ実装。DB テスト・ユニットテストとも OpenFGA サーバー不要で動作する
- **Composition Root（`server.ts`）** で本番は OpenFGA アダプタ、テストはインメモリアダプタを注入する

## 認可の処理フロー（例: 問い合わせ作成）

```mermaid
sequenceDiagram
    participant Client as HTTP Client
    participant Routes as contact-routes.ts
    participant UC as CreateContactUseCase
    participant Repo as ContactRepository
    participant DB as PostgreSQL
    participant Authz as AuthorizationService
    participant FGA as OpenFGA(PDP)

    Client->>Routes: POST /contacts (X-User-Id: alice)
    Routes->>Routes: userId = "alice" を抽出
    Routes->>UC: execute("alice", input)
    UC->>Repo: create(input)
    Repo->>DB: INSERT
    DB-->>Repo: contact.id = 42
    Repo-->>UC: Contact
    UC->>Authz: grantOwnership("alice", 42)
    Authz->>FGA: write 2 タプル
    Note over FGA: user:alice #owner contact:42<br/>(alice は contact:42 の owner)
    Note over FGA: system:global #parent contact:42<br/>(admin 継承用の parent リンク)
    FGA-->>Authz: OK
    Authz-->>UC: OK
    UC-->>Routes: Contact
    Routes-->>Client: 201 Created
```

## 認証

エンドポイントごとの認証・認可の要否は以下の通り。

| エンドポイント | 認証 (`X-User-Id`) | 認可 (OpenFGA) |
|---|---|---|
| `GET /health/*` | 不要 | 不要 |
| `GET /form-templates`, `GET /form-templates/:id` | 不要 | 不要 |
| `POST /form-templates`, `PUT /form-templates/:id`, `DELETE /form-templates/:id` | 必須 | 不要 |
| `/contacts/*`（すべて） | 必須 | 必須 |

`X-User-Id` が必須のエンドポイントでヘッダー未設定の場合は `401 Unauthorized` を返します。`/contacts/*` では加えて OpenFGA の認可チェックに失敗すると `403 Forbidden` を返します。

## 認可モデル

[data/openfga/model.fga](../data/openfga/model.fga) を参照。

## リレーションと権限

| リレーション | 説明 |
|-------------|------|
| `contact#owner` | 問い合わせの作成者。閲覧・編集・削除すべて可能 |
| `contact#editor` | 編集者。owner および system admin から継承 |
| `contact#viewer` | 閲覧者。editor から継承、system admin からも継承 |
| `system#admin` | 管理者。全 contact に対して閲覧・編集権限を持つ |

## 認可の動作

- **POST /contacts** — 作成後、作成者に `owner` リレーションを付与
- **GET /contacts** — ユーザーが `can_view` を持つ contact のみ返却（`listObjects` API）
- **GET /contacts/:id** — `can_view` チェック。権限なしで `403`
- **PATCH /contacts/:id/status** — `can_edit` チェック。権限なしで `403`
- **DELETE /contacts/:id** — `can_delete` チェック。権限なしで `403`。削除後にタプルも削除

## admin ユーザーの設定

```bash
# openfga:setup 実行時に --admin-user オプションで初期 admin を設定可能
npm run openfga:setup -- --admin-user admin-user-id
```
