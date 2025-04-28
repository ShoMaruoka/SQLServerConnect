/**
 * API呼び出しのユーティリティ関数
 */

// ベースURLを取得 (ngrok経由アクセス時はNEXT_PUBLIC_BASE_URLを使用)
export const getBaseUrl = () => {
  // 環境変数からベースURLを取得
  const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  // 環境変数が設定されていればそれを使用
  if (envBaseUrl) {
    return envBaseUrl.endsWith('/') ? envBaseUrl.slice(0, -1) : envBaseUrl;
  }
  
  // ブラウザで実行されている場合は現在のホストを使用
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // それ以外はローカルホストを使用
  return 'http://localhost:3000';
};

/**
 * APIエンドポイントのURLを生成
 * @param path APIのパス (例: /api/orders)
 */
export const getApiUrl = (path: string) => {
  const baseUrl = getBaseUrl();
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${apiPath}`;
};

/**
 * GETリクエストを実行
 * @param path APIのパス
 */
export const fetchApi = async <T>(path: string): Promise<T> => {
  const url = getApiUrl(path);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response.json();
};

/**
 * POSTリクエストを実行
 * @param path APIのパス
 * @param data 送信するデータ
 */
export const postApi = async <T>(path: string, data: any): Promise<T> => {
  const url = getApiUrl(path);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response.json();
};

/**
 * PUTリクエストを実行
 * @param path APIのパス
 * @param data 送信するデータ
 */
export const putApi = async <T>(path: string, data: any): Promise<T> => {
  const url = getApiUrl(path);
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response.json();
}; 