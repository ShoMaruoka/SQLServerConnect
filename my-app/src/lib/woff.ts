// WOFFプラットフォームとの連携を管理するためのユーティリティ

// SDK のグローバル宣言
declare global {
  interface Window {
    woff: {
      // 初期化
      init: (config: { woffId: string }) => Promise<void>;
      ready: Promise<void>;
      
      // 基本情報
      getOS: () => 'ios' | 'android' | 'web';
      getLanguage: () => string;
      getVersion: () => string;
      getWorksVersion: () => string;
      isInClient: () => boolean;
      
      // ユーザー情報
      getAccessToken: () => Promise<string>;
      getProfile: () => Promise<{
        userId: string;
        displayName: string;
        pictureUrl: string | null;
      }>;
      
      // UI操作
      openWindow: (params: { url: string, external: boolean }) => Promise<void>;
      closeWindow: () => Promise<void>;
      scanQR: () => Promise<{ result: string }>;
      login: () => Promise<void>;
      
      // メッセージ送信
      sendMessage: (params: { content: string }) => Promise<void>;
    };
  }
}

/**
 * WOFFアプリを初期化
 * @param woffId WOFF ID
 */
export const initWoff = async (woffId: string): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && window.woff) {
      await window.woff.init({ woffId });
      console.log('WOFF initialized successfully');
    } else {
      console.warn('WOFF SDK not available');
    }
  } catch (error) {
    console.error('WOFF initialization error:', error);
    throw error;
  }
};

/**
 * ユーザープロフィールを取得
 */
export const getProfile = async () => {
  if (typeof window === 'undefined' || !window.woff) {
    return null;
  }
  
  try {
    return await window.woff.getProfile();
  } catch (error) {
    console.error('Error getting profile:', error);
    return null;
  }
};

/**
 * WOFFアプリが実行される環境（OS）を取得
 */
export const getEnvironment = () => {
  if (typeof window === 'undefined' || !window.woff) {
    return 'web';
  }
  
  return window.woff.getOS();
};

/**
 * WOFFクライアント内で実行されているかを確認
 */
export const isInWoffClient = () => {
  if (typeof window === 'undefined' || !window.woff) {
    return false;
  }
  
  return window.woff.isInClient();
};

/**
 * WOFFアプリを閉じる
 */
export const closeWoffWindow = async () => {
  if (typeof window === 'undefined' || !window.woff) {
    return;
  }
  
  try {
    await window.woff.closeWindow();
  } catch (error) {
    console.error('Error closing window:', error);
  }
}; 