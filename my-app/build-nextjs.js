const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Next.jsアプリのビルドを開始 ===');

// 環境設定
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NODE_ENV = 'production';

try {
  // 型チェックをスキップしてビルド
  console.log('ビルド実行中...');
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_SKIP_TYPECHECKING: 'true'
    }
  });
  
  console.log('=== ビルド完了 ===');
} catch (error) {
  console.error('ビルド失敗:', error);
  process.exit(1);
} 