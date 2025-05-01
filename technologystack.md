# 技術スタック（※本記載は記入例です-プロジェクトに合わせて内容を更新してください-）

## 基本構成
フロントエンド: React
バックエンド: Node.js
データベース: SQL Server
ホスティング: Windows Server 2022 Standard
認証/連携: LINE WORKS (WOFF)

## 詳細技術スタック

### フロントエンド
React (UI ライブラリ)
TypeScript (型安全な開発)
Next.js (Vercelとの親和性が高いReactフレームワーク)
Axios/fetch (API通信)
React Query (サーバー状態管理)
Tailwind CSS (スタイリング)

### バックエンド
Node.js + Express (API サーバー)
TypeORM/Prisma (SQLServerとの連携)
JWT (認証トークン管理)
serverless functions (Vercel上での実行環境)

### データベース
SQL Server14.0.3370.1 (テストDBはDockerに構築)

### デプロイ/インフラ
Windows Server 2022 Standard (ホスティングプラットフォーム)
GitHub Actions (CI/CD)
Environment Variables (環境変数管理)

### LINE WORKS連携
LINE WORKS OpenAPI (WOFF)
OAuth 2.0 (認証フロー)
Webhook (イベント連携)

### セキュリティ
HTTPS
CORS対策
SQL インジェクション対策
XSS対策
