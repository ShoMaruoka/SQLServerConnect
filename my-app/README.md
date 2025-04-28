# SQL Server Connect WOFF App

LINE WORKS WOFF（WORKS Front-end Framework）を使用したSQL Server接続アプリケーションです。このアプリでは注文情報と商品情報を管理することができます。

## 機能

- 注文一覧の表示
- 注文明細の表示
- 商品情報の表示
- 価格の修正（修正フラグ付き）

## 技術スタック

- フロントエンド: React, Next.js, TypeScript, Tailwind CSS
- バックエンド: Next.js API Routes
- データベース: SQL Server
- 連携: LINE WORKS WOFF SDK

## 事前準備

1. SQL Serverのインストールと設定
2. LINE WORKS Developer ConsoleでのWOFFアプリ登録

## 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```
# データベース接続設定
DB_USER=sa
DB_PASSWORD=YourPassword
DB_SERVER=localhost
DB_NAME=OrderDB

# WOFF設定
WOFF_ID=YOUR_WOFF_ID_HERE
```

## インストールと実行

```bash
# パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# 本番サーバーの起動
npm start
```

## 初期セットアップ

1. アプリケーションを起動すると、初期セットアップ画面が表示されます
2. 「セットアップ」ボタンをクリックして、データベースのテーブル作成とサンプルデータを生成します
3. セットアップ完了後、アプリケーションの利用が可能になります

## WOFFアプリとしての設定

1. Developer Consoleで取得したWOFF IDを`.env.local`ファイルに設定します
2. WOFF URLから、アプリケーションにアクセスすることができます

## ライセンス

このプロジェクトはISCライセンスの下で提供されています。
