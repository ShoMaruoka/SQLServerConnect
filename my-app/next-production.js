const { spawn } = require('child_process');
const path = require('path');

// 環境変数設定
process.env.NODE_ENV = 'production';
process.env.PORT = '4000';

console.log('=== Next.js本番アプリを起動します ===');
console.log(`起動時刻: ${new Date().toLocaleString()}`);
console.log(`ポート: ${process.env.PORT}`);

// nextのスタートコマンドを実行
const nextStart = spawn('node', [
  './node_modules/next/dist/bin/next', 
  'start',
  '-p',
  process.env.PORT
], {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

// エラーハンドリング
nextStart.on('error', (error) => {
  console.error('Next.js起動エラー:', error);
});

// プロセス終了時の処理
nextStart.on('exit', (code) => {
  console.log(`Next.jsプロセス終了。コード: ${code}`);
  if (code !== 0) {
    console.log('エラーが発生したため、シンプルサーバーに切り替えることを検討してください');
  }
}); 