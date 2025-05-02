@echo off
REM Windows Server 2022 Standardへのデプロイスクリプト

echo ===== SQLServer Connect アプリケーションデプロイスクリプト =====
echo.

REM 管理者権限チェック
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo このスクリプトは管理者権限で実行してください。
    pause
    exit /b 1
)

REM 必要なディレクトリの作成
echo アプリケーションディレクトリの作成...
if not exist "C:\inetpub\wwwroot\SQLServerConnect" (
    mkdir "C:\inetpub\wwwroot\SQLServerConnect"
)

REM Gitがインストールされているか確認
where git >nul 2>&1
if %errorLevel% neq 0 (
    echo Gitがインストールされていません。インストールしてから再実行してください。
    pause
    exit /b 1
)

REM Node.jsがインストールされているか確認
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo Node.jsがインストールされていません。インストールしてから再実行してください。
    pause
    exit /b 1
)

REM アプリケーションの取得と配置
echo GitHubからアプリケーションをクローン...
cd "C:\inetpub\wwwroot\SQLServerConnect"
if exist ".git" (
    echo リポジトリの更新...
    git pull
) else (
    echo リポジトリのクローン...
    git clone https://github.com/ShoMaruoka/SQLServerConnect.git .
)

REM パッケージのインストールとビルド
echo Node.jsパッケージのインストール...
cd "C:\inetpub\wwwroot\SQLServerConnect\my-app"
call npm install

REM 環境設定ファイルが存在するか確認
if not exist ".env.local" (
    echo 環境変数ファイルの作成...
    echo # データベース接続設定 > .env.local
    echo DB_USER=sa >> .env.local
    echo DB_PASSWORD=YourStrong@Password123 >> .env.local
    echo DB_SERVER=localhost >> .env.local
    echo DB_NAME=OrderDB >> .env.local
    echo. >> .env.local
    echo # WOFF設定 >> .env.local
    echo WOFF_ID=YOUR_WOFF_ID_HERE >> .env.local
    
    echo 環境変数ファイル (.env.local) が作成されました。
    echo 必要に応じて値を編集してください。
)

REM Web.configの作成
echo IIS用Web.configの作成...
echo ^<?xml version="1.0" encoding="UTF-8"?^> > Web.config
echo ^<configuration^> >> Web.config
echo   ^<system.webServer^> >> Web.config
echo     ^<rewrite^> >> Web.config
echo       ^<rules^> >> Web.config
echo         ^<rule name="ReverseProxyInboundRule1" stopProcessing="true"^> >> Web.config
echo           ^<match url="(.*)" /^> >> Web.config
echo           ^<action type="Rewrite" url="http://localhost:3000/{R:1}" /^> >> Web.config
echo         ^</rule^> >> Web.config
echo       ^</rules^> >> Web.config
echo     ^</rewrite^> >> Web.config
echo   ^</system.webServer^> >> Web.config
echo ^</configuration^> >> Web.config

REM アプリケーションのビルド
echo アプリケーションのビルド...
call npm run build

REM PM2のインストールと設定
echo PM2のインストールと設定...
call npm install pm2 -g
call pm2 delete sqlserver-connect 2>nul
call pm2 start npm --name "sqlserver-connect" -- start
call pm2 save

REM NSSMのダウンロードと設定
echo NSSMのダウンロードと設定...
if not exist "C:\tools" mkdir "C:\tools"

echo NSSMをダウンロード中...
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'C:\tools\nssm.zip'}"

echo NSSMを解凍中...
powershell -Command "& {Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('C:\tools\nssm.zip', 'C:\tools')}"

echo NSSM実行ファイルをコピー中...
copy "C:\tools\nssm-2.24\win64\nssm.exe" "C:\tools\nssm.exe" /Y

echo PM2サービスの登録...
"C:\tools\nssm.exe" stop PM2 2>nul
"C:\tools\nssm.exe" remove PM2 confirm 2>nul

echo PM2のパスを確認...
where pm2 > C:\tools\pm2path.txt
for /f "tokens=*" %%a in (C:\tools\pm2path.txt) do set PM2_PATH=%%a
set PM2_CMD_PATH=%USERPROFILE%\AppData\Roaming\npm\pm2.cmd

echo PM2サービスの詳細設定...
"C:\tools\nssm.exe" install PM2 "%PM2_CMD_PATH%"
"C:\tools\nssm.exe" set PM2 AppParameters resurrect
"C:\tools\nssm.exe" set PM2 AppDirectory "%USERPROFILE%\AppData\Roaming\npm"
"C:\tools\nssm.exe" set PM2 DisplayName "PM2 Process Manager"
"C:\tools\nssm.exe" set PM2 Description "PM2 Process Manager for Node.js Applications"
"C:\tools\nssm.exe" set PM2 Start SERVICE_AUTO_START
"C:\tools\nssm.exe" set PM2 AppStdout "C:\tools\pm2_service.log"
"C:\tools\nssm.exe" set PM2 AppStderr "C:\tools\pm2_error.log"
"C:\tools\nssm.exe" set PM2 AppRotateFiles 1
"C:\tools\nssm.exe" set PM2 AppRotateOnline 1
"C:\tools\nssm.exe" set PM2 AppRotateSeconds 86400
"C:\tools\nssm.exe" set PM2 AppRotateBytes 1048576

echo PM2サービスの開始...
"C:\tools\nssm.exe" start PM2

echo サービスの状態を確認...
sc query PM2

REM IISアプリケーションプールとサイトの作成
echo IISの設定...
%windir%\system32\inetsrv\appcmd.exe delete apppool "SQLServerConnectAppPool" 2>nul
%windir%\system32\inetsrv\appcmd.exe add apppool /name:"SQLServerConnectAppPool" /managedRuntimeVersion:"" /managedPipelineMode:Integrated
%windir%\system32\inetsrv\appcmd.exe delete site "SQLServerConnect" 2>nul
%windir%\system32\inetsrv\appcmd.exe add site /name:"SQLServerConnect" /physicalPath:"C:\inetpub\wwwroot\SQLServerConnect\my-app" /bindings:http/*:80:

REM ファイアウォールの設定
echo ファイアウォールの設定...
netsh advfirewall firewall add rule name="SQLServerConnect HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="SQLServerConnect HTTPS" dir=in action=allow protocol=TCP localport=443
netsh advfirewall firewall add rule name="SQLServerConnect Node" dir=in action=allow protocol=TCP localport=3000

echo.
echo ===== デプロイが完了しました =====
echo アプリケーションは http://localhost/ でアクセスできます。
echo.
echo PM2サービスログは C:\tools\pm2_service.log で確認できます。
echo PM2エラーログは C:\tools\pm2_error.log で確認できます。
echo.
pause 