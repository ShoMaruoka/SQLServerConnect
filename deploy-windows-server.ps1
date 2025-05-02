# Windows Server 2022 Standard へのデプロイスクリプト
# このスクリプトは管理者権限で実行する必要があります

param (
    [string]$RepoUrl = "https://github.com/ShoMaruoka/SQLServerConnect.git",
    [string]$AppPath = "C:\inetpub\wwwroot\SQLServerConnect",
    [string]$DbUser = "sa",
    [string]$DbPassword = "YourStrong@Password123",
    [string]$DbServer = "localhost",
    [string]$DbName = "OrderDB",
    [string]$WoffId = "YOUR_WOFF_ID_HERE",
    [string]$AppPort = "80",
    [switch]$EnableSsl = $false,
    [switch]$Force = $false
)

function Write-Step {
    param ([string]$Message)
    Write-Host ""
    Write-Host "========== $Message ==========" -ForegroundColor Cyan
}

function Test-Administrator {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-Command {
    param ([string]$Command)
    return [bool](Get-Command -Name $Command -ErrorAction SilentlyContinue)
}

Write-Step "SQLServer Connect アプリケーションデプロイスクリプト"

# 管理者権限チェック
if (-not (Test-Administrator)) {
    Write-Host "このスクリプトは管理者権限で実行してください。" -ForegroundColor Red
    exit 1
}

# 必要なコマンドのチェック
Write-Step "依存関係のチェック"

$requiredCommands = @("git", "node", "npm")
$allCommandsAvailable = $true

foreach ($cmd in $requiredCommands) {
    if (-not (Test-Command $cmd)) {
        Write-Host "$cmd がインストールされていません。インストールしてから再実行してください。" -ForegroundColor Red
        $allCommandsAvailable = $false
    } else {
        Write-Host "$cmd は利用可能です: $((Get-Command $cmd).Version)" -ForegroundColor Green
    }
}

if (-not $allCommandsAvailable) {
    exit 1
}

# IIS が利用可能か確認
if (-not (Get-Service -Name W3SVC -ErrorAction SilentlyContinue)) {
    Write-Host "IIS (Web Server) がインストールされていません。サーバーマネージャーからインストールしてください。" -ForegroundColor Red
    exit 1
}

# URL Rewrite モジュールのチェック
$urlRewriteInstalled = $false
try {
    Import-Module WebAdministration -ErrorAction Stop
    $urlRewriteInstalled = [bool](Get-WebGlobalModule -Name "RewriteModule" -ErrorAction SilentlyContinue)
} catch {
    Write-Host "WebAdministration モジュールをロードできません: $_" -ForegroundColor Red
}

if (-not $urlRewriteInstalled) {
    Write-Host "URL Rewrite モジュールがインストールされていません。" -ForegroundColor Yellow
    Write-Host "インストールには Microsoft Web Platform Installer を使用してください。" -ForegroundColor Yellow
    $installRewrite = Read-Host "続行しますか? (y/n)"
    if ($installRewrite -eq "y") {
        # URL Rewrite モジュールのインストール方法を表示
        Write-Host "URL Rewrite モジュールをインストールするには、次の手順を実行してください:" -ForegroundColor Yellow
        Write-Host "1. Microsoft Web Platform Installer をダウンロードしてインストール: https://www.microsoft.com/web/downloads/platform.aspx" -ForegroundColor Yellow
        Write-Host "2. Web Platform Installer を起動" -ForegroundColor Yellow
        Write-Host "3. 'URL Rewrite 2.1' を検索してインストール" -ForegroundColor Yellow
        Write-Host "インストール後、このスクリプトを再実行してください。" -ForegroundColor Yellow
        exit 1
    } else {
        exit 1
    }
}

# アプリケーションディレクトリの作成
Write-Step "アプリケーションディレクトリの準備"
if (-not (Test-Path $AppPath)) {
    New-Item -Path $AppPath -ItemType Directory -Force | Out-Null
    Write-Host "ディレクトリを作成しました: $AppPath" -ForegroundColor Green
} else {
    Write-Host "ディレクトリは既に存在します: $AppPath" -ForegroundColor Green
}

# リポジトリのクローン/更新
Write-Step "GitHubからアプリケーションのクローン"
Set-Location $AppPath

if (Test-Path "$AppPath\.git") {
    if ($Force) {
        Write-Host "既存のリポジトリを強制的に更新します" -ForegroundColor Yellow
        git fetch --all
        git reset --hard origin/main
        git pull
    } else {
        Write-Host "リポジトリの更新..." -ForegroundColor Green
        git pull
    }
} else {
    Write-Host "リポジトリのクローン: $RepoUrl" -ForegroundColor Green
    git clone $RepoUrl .
}

# アプリケーションのビルド
Write-Step "Node.jsパッケージのインストールとビルド"
Set-Location "$AppPath\my-app"

# 環境変数ファイルの設定
if (-not (Test-Path "$AppPath\my-app\.env.local") -or $Force) {
    Write-Host "環境変数ファイルの作成..." -ForegroundColor Green
    @"
# データベース接続設定
DB_USER=$DbUser
DB_PASSWORD=$DbPassword
DB_SERVER=$DbServer
DB_NAME=$DbName

# WOFF設定
WOFF_ID=$WoffId
"@ | Out-File -FilePath "$AppPath\my-app\.env.local" -Encoding utf8
    Write-Host "環境変数ファイル (.env.local) を作成しました" -ForegroundColor Green
} else {
    Write-Host "環境変数ファイル (.env.local) は既に存在します" -ForegroundColor Green
}

# IIS用Web.configの作成
if (-not (Test-Path "$AppPath\my-app\Web.config") -or $Force) {
    Write-Host "IIS用Web.configの作成..." -ForegroundColor Green
    @"
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
"@ | Out-File -FilePath "$AppPath\my-app\Web.config" -Encoding utf8
    Write-Host "Web.configファイルを作成しました" -ForegroundColor Green
} else {
    Write-Host "Web.configファイルは既に存在します" -ForegroundColor Green
}

# パッケージのインストールとビルド
Write-Host "Node.jsパッケージのインストール..." -ForegroundColor Green
npm install

Write-Host "アプリケーションのビルド..." -ForegroundColor Green
npm run build

# PM2のインストールと設定
Write-Step "PM2のインストールと設定"
if (-not (Test-Command "pm2")) {
    Write-Host "PM2のグローバルインストール..." -ForegroundColor Green
    npm install pm2 -g
} else {
    Write-Host "PM2は既にインストールされています" -ForegroundColor Green
}

Write-Host "アプリケーションをPM2で起動..." -ForegroundColor Green
pm2 delete sqlserver-connect 2>$null
pm2 start npm --name "sqlserver-connect" -- start
pm2 save

# NSSM を使用してPM2をWindowsサービスとして登録
Write-Step "NSSM を使用してPM2をWindowsサービスとして登録"

$ToolsPath = "C:\tools"
$NssmZipPath = "$ToolsPath\nssm.zip"
$NssmExtractPath = "$ToolsPath\nssm-extract"
$NssmPath = "$ToolsPath\nssm.exe"

# tools ディレクトリの作成
if (-not (Test-Path $ToolsPath)) {
    Write-Host "ツール用ディレクトリの作成: $ToolsPath" -ForegroundColor Green
    New-Item -Path $ToolsPath -ItemType Directory -Force | Out-Null
}

# NSSM のダウンロードと展開
if (-not (Test-Path $NssmPath) -or $Force) {
    Write-Host "NSSM のダウンロード..." -ForegroundColor Green
    
    # TLS 1.2 を使用してダウンロード
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    
    try {
        Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile $NssmZipPath
        
        # 既存の解凍先ディレクトリがあれば削除
        if (Test-Path $NssmExtractPath) {
            Remove-Item -Path $NssmExtractPath -Recurse -Force
        }
        
        # Zip ファイルを解凍
        Write-Host "NSSM の解凍..." -ForegroundColor Green
        Expand-Archive -Path $NssmZipPath -DestinationPath $NssmExtractPath -Force
        
        # nssm.exe をコピー
        Write-Host "NSSM 実行ファイルをコピー..." -ForegroundColor Green
        Copy-Item -Path "$NssmExtractPath\nssm-2.24\win64\nssm.exe" -Destination $NssmPath -Force
        
        Write-Host "NSSM のセットアップが完了しました: $NssmPath" -ForegroundColor Green
    }
    catch {
        Write-Host "NSSM のダウンロードまたは展開に失敗しました: $_" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "NSSM は既に存在します: $NssmPath" -ForegroundColor Green
}

# PM2 サービスの登録
$PM2ServiceName = "PM2"
$PM2ExePath = "$env:USERPROFILE\AppData\Roaming\npm\pm2.cmd"

Write-Host "PM2 サービスの登録..." -ForegroundColor Green

# PM2のパス確認
Write-Host "PM2のパスを確認..." -ForegroundColor Green
$PM2PathCheck = Get-Command pm2 -ErrorAction SilentlyContinue
if ($PM2PathCheck) {
    Write-Host "PM2が見つかりました: $($PM2PathCheck.Source)" -ForegroundColor Green
} else {
    Write-Host "PM2が見つかりません。インストールされているか確認してください。" -ForegroundColor Yellow
}

# 既存のサービスを停止して削除
& $NssmPath stop $PM2ServiceName 2>$null
& $NssmPath remove $PM2ServiceName confirm 2>$null

# 新しいサービスを登録
Write-Host "PM2サービスの詳細設定..." -ForegroundColor Green
& $NssmPath install $PM2ServiceName $PM2ExePath
& $NssmPath set $PM2ServiceName AppParameters "resurrect"
& $NssmPath set $PM2ServiceName AppDirectory "$env:USERPROFILE\AppData\Roaming\npm"
& $NssmPath set $PM2ServiceName DisplayName "PM2 Process Manager"
& $NssmPath set $PM2ServiceName Description "PM2 Process Manager for Node.js Applications"
& $NssmPath set $PM2ServiceName Start SERVICE_AUTO_START
& $NssmPath set $PM2ServiceName AppStdout "$ToolsPath\pm2_service.log"
& $NssmPath set $PM2ServiceName AppStderr "$ToolsPath\pm2_error.log"
& $NssmPath set $PM2ServiceName AppRotateFiles 1
& $NssmPath set $PM2ServiceName AppRotateOnline 1
& $NssmPath set $PM2ServiceName AppRotateSeconds 86400
& $NssmPath set $PM2ServiceName AppRotateBytes 1048576

# サービスの開始
Write-Host "PM2 サービスの開始..." -ForegroundColor Green
& $NssmPath start $PM2ServiceName

# サービスの状態確認
Write-Host "サービスの状態を確認..." -ForegroundColor Green
Get-Service -Name $PM2ServiceName | Format-Table Name, Status, DisplayName

# IISの設定
Write-Step "IISの設定"
Import-Module WebAdministration

# アプリケーションプールの作成
if (Test-Path "IIS:\AppPools\SQLServerConnectAppPool") {
    Write-Host "既存のアプリケーションプールを削除..." -ForegroundColor Yellow
    Remove-WebAppPool -Name "SQLServerConnectAppPool" -ErrorAction SilentlyContinue
}

Write-Host "アプリケーションプールの作成..." -ForegroundColor Green
New-WebAppPool -Name "SQLServerConnectAppPool" | Out-Null
Set-ItemProperty -Path "IIS:\AppPools\SQLServerConnectAppPool" -Name "managedRuntimeVersion" -Value ""
Set-ItemProperty -Path "IIS:\AppPools\SQLServerConnectAppPool" -Name "managedPipelineMode" -Value "Integrated"

# Webサイトの作成
if (Test-Path "IIS:\Sites\SQLServerConnect") {
    Write-Host "既存のWebサイトを削除..." -ForegroundColor Yellow
    Remove-Website -Name "SQLServerConnect" -ErrorAction SilentlyContinue
}

Write-Host "Webサイトの作成..." -ForegroundColor Green
New-Website -Name "SQLServerConnect" -PhysicalPath "$AppPath\my-app" -ApplicationPool "SQLServerConnectAppPool" -Port $AppPort -Force | Out-Null

# SSL設定（オプション）
if ($EnableSsl) {
    Write-Host "SSL設定の有効化..." -ForegroundColor Green
    
    # 自己署名証明書の作成（本番環境では正式な証明書を使用すること）
    $cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\LocalMachine\My"
    $certThumbprint = $cert.Thumbprint
    
    # HTTPSバインディングの追加
    New-WebBinding -Name "SQLServerConnect" -Protocol "https" -Port 443 -SslFlags 0
    
    # 証明書のバインド
    $binding = Get-WebBinding -Name "SQLServerConnect" -Protocol "https"
    $binding.AddSslCertificate($certThumbprint, "my")
    
    Write-Host "SSL設定が完了しました" -ForegroundColor Green
}

# ファイアウォールの設定
Write-Step "ファイアウォールの設定"
Write-Host "HTTP/HTTPSポートのファイアウォール許可..." -ForegroundColor Green

New-NetFirewallRule -DisplayName "SQLServerConnect HTTP" -Direction Inbound -Protocol TCP -LocalPort $AppPort -Action Allow -ErrorAction SilentlyContinue | Out-Null
if ($EnableSsl) {
    New-NetFirewallRule -DisplayName "SQLServerConnect HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue | Out-Null
}
New-NetFirewallRule -DisplayName "SQLServerConnect Node" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -ErrorAction SilentlyContinue | Out-Null

Write-Step "デプロイが完了しました"
Write-Host "アプリケーションは以下のURLでアクセスできます:" -ForegroundColor Green
Write-Host "http://localhost:$AppPort/" -ForegroundColor Cyan
if ($EnableSsl) {
    Write-Host "https://localhost/" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "PM2サービスログは $ToolsPath\pm2_service.log で確認できます" -ForegroundColor Yellow
Write-Host "PM2エラーログは $ToolsPath\pm2_error.log で確認できます" -ForegroundColor Yellow
Write-Host ""
Write-Host "その他のトラブルシューティング情報:" -ForegroundColor Yellow
Write-Host "- IISログ: %SystemDrive%\inetpub\logs\LogFiles" -ForegroundColor Yellow
Write-Host "- PM2ログ: pm2 logs" -ForegroundColor Yellow
Write-Host "- アプリケーションイベントログ" -ForegroundColor Yellow 