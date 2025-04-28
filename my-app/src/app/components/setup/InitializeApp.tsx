'use client';

import { useState, useEffect } from 'react';

export default function InitializeApp() {
  const [checking, setChecking] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [setting, setSetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // アプリの初期化状態確認
    const checkInitialization = async () => {
      try {
        setChecking(true);
        const response = await fetch('/api/init');
        const data = await response.json();
        
        setInitialized(data.success && data.data.initialized);
      } catch (err) {
        console.error('初期化確認エラー:', err);
        setError('初期化状態の確認中にエラーが発生しました');
      } finally {
        setChecking(false);
      }
    };

    checkInitialization();
  }, []);

  // データベースのセットアップ
  const handleSetup = async () => {
    try {
      setSetting(true);
      setError(null);
      
      const response = await fetch('/api/setup');
      const data = await response.json();
      
      if (data.success) {
        setInitialized(true);
      } else {
        setError(data.error || 'データベースのセットアップに失敗しました');
      }
    } catch (err) {
      console.error('セットアップエラー:', err);
      setError('データベースのセットアップ中にエラーが発生しました');
    } finally {
      setSetting(false);
    }
  };

  // アプリの再確認
  const handleRetry = () => {
    setError(null);
    window.location.reload();
  };

  if (checking) {
    return (
      <div className="fixed inset-0 z-50 bg-white bg-opacity-75 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">アプリケーションを確認中...</p>
        </div>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <h3 className="text-lg font-medium mb-4">アプリケーション初期化</h3>
          
          <p className="text-gray-600 mb-4">
            データベースの初期化が必要です。セットアップボタンをクリックしてデータベーステーブルを作成してください。
          </p>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleRetry}
              disabled={setting}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded"
            >
              再確認
            </button>
            
            <button
              onClick={handleSetup}
              disabled={setting}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded flex items-center"
            >
              {setting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              セットアップ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null; // 初期化済みの場合は何も表示しない
} 