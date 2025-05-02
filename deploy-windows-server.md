# Windows Server 2022 Standardへのデプロイ手順

## 前提条件
- Windows Server 2022 Standard がセットアップ済みであること
- 管理者権限でサーバーにアクセスできること

## 1. 必要なソフトウェアのインストール

### 1.1 Node.jsのインストール
1. [Node.js公式サイト](https://nodejs.org/)からLTS版をダウンロード
2. インストーラを実行し、デフォルト設定でインストール
3. インストール確認
   ```
   node -v
   npm -v
   ```

### 1.2 Git のインストール
1. [Git公式サイト](https://git-scm.com/download/win)からインストーラをダウンロード
2. インストーラを実行し、デフォルト設定でインストール
3. インストール確認
   ```
   git --version
   ```

### 1.3 IISのインストールと設定
1. サーバーマネージャーを開く
2. 「役割と機能の追加」をクリック
3. 「Web サーバー (IIS)」を選択
4. 「URL Rewrite Module」をインストール（Microsoft Web Platform Installerから）

## 2. アプリケーションのデプロイ

### 2.1 GitHubからコードをクローン
1. アプリケーションを配置するディレクトリを作成
   ```
   mkdir C:\inetpub\wwwroot\SQLServerConnect
   cd C:\inetpub\wwwroot\SQLServerConnect
   ```
2. GitHubからリポジトリをクローン
   ```
   git clone https://github.com/ShoMaruoka/SQLServerConnect.git .
   ```

### 2.2 アプリケーションのビルド
1. 必要なパッケージのインストール
   ```
   cd my-app
   npm install
   ```
2. 環境変数の設定 (`.env.local`ファイルを作成)
   ```
   # データベース接続設定
   DB_USER=sa
   DB_PASSWORD=YourPassword
   DB_SERVER=localhost
   DB_NAME=OrderDB

   # WOFF設定
   WOFF_ID=YOUR_WOFF_ID_HERE
   ```
3. アプリケーションのビルド
   ```
   npm run build
   ```

## 3. IIS の設定

### 3.1 リバースプロキシの設定
1. Web.config ファイルを作成（以下の内容を `C:\inetpub\wwwroot\SQLServerConnect\my-app\Web.config` に保存）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxyInboundRule1" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:3000/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

### 3.2 アプリケーションプールの作成
1. IISマネージャーを開く
2. 「アプリケーションプール」を右クリック → 「アプリケーションプールの追加」
3. 名前: `SQLServerConnectAppPool`
4. .NET CLR バージョン: `No Managed Code`
5. 管理対象パイプラインモード: `Integrated`
6. 「OK」をクリック

### 3.3 Webサイトの作成
1. 「サイト」を右クリック → 「Webサイトの追加」
2. サイト名: `SQLServerConnect`
3. アプリケーションプール: `SQLServerConnectAppPool`
4. 物理パス: `C:\inetpub\wwwroot\SQLServerConnect\my-app`
5. ポートバインディング: `80` (または必要なポート)
6. 「OK」をクリック

## 4. Node.jsサービスの設定

### 4.1 PM2のインストール
PM2を使用してNode.jsアプリケーションをサービスとして実行します。
```
npm install pm2 -g
```

### 4.2 アプリケーションの起動
```
cd C:\inetpub\wwwroot\SQLServerConnect\my-app
pm2 start npm --name "sqlserver-connect" -- start
pm2 save
```

### 4.3 PM2をWindowsサービスとして登録

**NSSM（Non-Sucking Service Manager）を使用する方法**

1. **NSSMのダウンロードとインストール**
   - [NSSM公式サイト](https://nssm.cc/download)から最新版(`nssm-2.24.zip`)をダウンロード
   - ダウンロードしたzipファイルを解凍し、システムに応じたバージョン（通常は64ビット版）のnssm.exeを適当な場所（例：`C:\tools\nssm.exe`）にコピー

2. **NSSMを使用してPM2をサービスとして登録**
   - コマンドプロンプトを管理者として実行
   - 以下のコマンドを実行してサービス設定画面を表示:
     ```
     C:\tools\nssm.exe install PM2
     ```

3. **サービス設定の構成**
   - **Application タブ**:
     - Path: `%USERPROFILE%\AppData\Roaming\npm\pm2.cmd`
     - Startup directory: `%USERPROFILE%\AppData\Roaming\npm`
     - Arguments: `resurrect`

   - **Details タブ**:
     - Display name: `PM2 Process Manager`
     - Description: `PM2 Process Manager for Node.js Applications`
     - Startup type: `Automatic`

   - **I/O タブ** (オプション):
     - Output (stdout): `C:\tools\pm2_service.log` 
     - Error (stderr): `C:\tools\pm2_error.log`

4. **サービスのインストールと開始**
   - 「Install service」ボタンをクリックしてサービスをインストール
   - サービスコントロールパネルまたは以下のコマンドでサービスを開始:
     ```
     net start PM2
     ```

5. **サービスの状態確認**
   - サービスが正常に動作しているか確認:
     ```
     sc query PM2
     ```

**注意事項**:
- サービスがうまく起動しない場合、PM2のパスが正しいか確認してください（`where pm2`コマンドで確認できます）
- アクセス権限の問題がある場合は、「Log On」タブでサービスの実行ユーザーを調整してください
- `PM2_HOME`環境変数が設定されている場合、そのパスが正しいことを確認してください

### 4.4 トラブルシューティング
- PM2サービスが起動しない場合:
  - サービスログ（`C:\tools\pm2_service.log`, `C:\tools\pm2_error.log`）を確認
  - イベントビューアでシステムログを確認
  - `pm2 ls`コマンドでPM2の状態を確認
  - 必要に応じてサービスを再設定（`nssm.exe edit PM2`）

## 5. ファイアウォールの設定
1. Windowsファイアウォールで、ポート80（と必要に応じて443）の受信トラフィックを許可

## 6. SSL証明書の設定（推奨）
1. IISマネージャーを開く
2. サーバー名を選択 → 「サーバー証明書」をダブルクリック
3. 「自己署名入り証明書の作成」（または正式な証明書をインポート）
4. Webサイトのバインディングに、ポート443でHTTPSを追加

## 7. 動作確認
1. Webブラウザで `http://サーバーのIPアドレス/` にアクセス
2. アプリケーションが正常に表示されることを確認

## 8. 自動デプロイの設定（オプション）
GitHubアクションを使用して自動デプロイを設定することができます：

1. `.github/workflows/deploy.yml` ファイルを作成
2. GitHub SecretsにサーバーアクセスのSSH鍵を登録
3. リポジトリに変更がプッシュされたときに自動的にサーバーにデプロイするワークフローを設定

## トラブルシューティング
- IISのアプリケーションログを確認
- PM2ログを確認: `pm2 logs`
- Node.jsアプリケーションのログを確認
- ファイアウォール設定の確認
- ネットワーク接続性の確認

### PM2サービス登録のトラブルシューティング
- pm2-service-installコマンドが見つからない場合は、代わりにNSSMを使用する
- サービスが起動しない場合、PM2_HOME環境変数が正しく設定されているか確認する（システム環境変数として設定することを推奨）
- サービスとして実行する場合は、絶対パスを使用してアプリケーションを起動するように設定する 