# Windows Server 2022 + IIS でのNext.jsアプリの構成ガイド

このガイドでは、Windows Server 2022 と IIS を使用して、Next.jsアプリケーションを実行するための詳細な手順を説明します。

## 前提条件

- Windows Server 2022 Standard がインストールされている
- 管理者権限がある

## 1. IIS のインストール

サーバーマネージャーを使用して IIS をインストールします。

1. サーバーマネージャーを開く
2. 「役割と機能の追加」をクリック
3. 「役割ベースまたは機能ベースのインストール」を選択
4. サーバーを選択して次へ
5. 「Webサーバー (IIS)」にチェック
6. 「管理ツール」→「IIS 管理コンソール」も選択
7. インストールを完了

## 2. 必要なIIS モジュールのインストール

### URL Rewrite モジュールのインストール

1. [Microsoft Web Platform Installer](https://www.microsoft.com/web/downloads/platform.aspx) をダウンロードしてインストール
2. Web Platform Installer を起動
3. 「URL Rewrite 2.1」を検索してインストール

### Application Request Routing (ARR) のインストール

1. Web Platform Installer で「Application Request Routing」を検索
2. インストールをクリック

## 3. Node.js のインストール

1. [Node.js 公式サイト](https://nodejs.org/)から LTS バージョンをダウンロード
2. インストーラを実行し、すべてデフォルトオプションでインストール
3. インストール後、コマンドプロンプトを開いて確認：
   ```
   node -v
   npm -v
   ```

## 4. PM2 のインストール

PM2 はNode.jsアプリケーションをバックグラウンドサービスとして実行するために使用します。

1. コマンドプロンプトを管理者として開く
2. 以下のコマンドを実行：
   ```
   npm install pm2 -g
   ```

## 5. PM2 をWindowsサービスとして構成

1. 以下のコマンドを実行：
   ```
   npm install pm2-windows-startup -g
   pm2-startup install
   ```

## 6. IIS の詳細設定

### ARR の逆プロキシ有効化

1. IIS マネージャーを開く
2. サーバー名をクリック
3. 「Application Request Routing Cache」をダブルクリック
4. 右側のパネルで「サーバー プロキシ設定」をクリック
5. 「プロキシを有効にする」にチェックを入れる
6. 適用をクリック

### カスタム HTTP レスポンスヘッダーの設定（CORS対応）

1. IIS マネージャーでサーバーまたはサイトを選択
2. 「HTTP レスポンス ヘッダー」をダブルクリック
3. 「カスタム HTTP ヘッダーの追加」をクリック
4. 以下のヘッダーを追加：
   - 名前: `Access-Control-Allow-Origin`
   - 値: `*`
5. 必要に応じて他の CORS ヘッダーも追加

## 7. サイト固有の Web.config の詳細設定

Next.js アプリケーションのディレクトリに配置する Web.config ファイルの詳細：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- Node.js アプリケーションへのリバースプロキシ -->
        <rule name="ReverseProxyToNodeApp" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
          </conditions>
          <action type="Rewrite" url="http://localhost:3000/{R:1}" />
        </rule>
      </rules>
    </rewrite>
    
    <!-- 静的ファイルのキャッシュ設定 -->
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="7.00:00:00" />
      <mimeMap fileExtension=".webp" mimeType="image/webp" />
      <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
    </staticContent>
    
    <!-- セキュリティヘッダー -->
    <httpProtocol>
      <customHeaders>
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="X-XSS-Protection" value="1; mode=block" />
        <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains" />
      </customHeaders>
    </httpProtocol>
    
    <!-- 圧縮設定 -->
    <urlCompression doStaticCompression="true" doDynamicCompression="true" />
  </system.webServer>
</configuration>
```

## 8. 実際のデプロイ手順

1. アプリケーションのビルド：
   ```
   cd /path/to/your/nextjs/app
   npm install
   npm run build
   ```

2. PM2 で起動：
   ```
   pm2 start npm --name "nextjs-app" -- start
   pm2 save
   ```

3. IIS サイト設定：
   - IIS マネージャーを開く
   - サイトを追加
   - 物理パスをアプリケーションディレクトリに設定
   - アプリケーションプールを「No Managed Code」に設定

## 9. SSL の設定

1. 証明書の取得 (Let's Encrypt または商用 SSL)
2. IIS マネージャーで「サーバー証明書」を開く
3. 証明書をインポート
4. サイトのバインディングで HTTPS を追加し、証明書を選択

## 10. 監視とトラブルシューティング

### ログの確認方法

1. IIS ログの場所：
   ```
   %SystemDrive%\inetpub\logs\LogFiles
   ```

2. PM2 ログの確認：
   ```
   pm2 logs
   ```

3. Windows イベントログの確認：
   - イベントビューアーを開く
   - アプリケーションログを確認

### 一般的な問題と解決策

1. **502.3 - Bad Gateway エラー**
   - Node.jsアプリケーションが実行されているか確認
   - ポートが正しく設定されているか確認
   - ファイアウォール設定を確認

2. **静的ファイルが読み込まれない**
   - IIS の静的コンテンツ機能が有効か確認
   - MIME タイプが正しく設定されているか確認

3. **パフォーマンスの問題**
   - 圧縮が有効になっているか確認
   - 静的コンテンツのキャッシュを確認
   - アプリケーションプールの設定を確認

## 11. パフォーマンス最適化

1. **キャッシュ設定**
   - 静的アセット (画像、CSS、JS など) に適切な Cache-Control ヘッダーを設定

2. **圧縮設定**
   - IIS の動的および静的コンテンツ圧縮を有効にする

3. **アプリケーションプールの設定**
   - アイドルタイムアウトを調整して不要な再起動を防止
   - リサイクル設定を最適化

4. **HTTP/2 サポートの有効化**
   - Windows Server 2022 と IIS 10 では HTTP/2 がサポートされています
   - HTTPS バインディングで自動的に有効化

## 12. バックアップと復元の手順

1. **設定のバックアップ**
   - IIS の構成をエクスポート：
     ```
     %windir%\system32\inetsrv\appcmd list site /config /xml > sites.xml
     %windir%\system32\inetsrv\appcmd list apppool /config /xml > apppools.xml
     ```

2. **アプリケーションのバックアップ**
   - ファイルシステムのバックアップを定期的に実行
   - 環境変数や設定ファイルのバックアップ

3. **復元手順**
   - IIS 設定の復元：
     ```
     %windir%\system32\inetsrv\appcmd add site /in < sites.xml
     %windir%\system32\inetsrv\appcmd add apppool /in < apppools.xml
     ```
   - アプリケーションファイルの復元 