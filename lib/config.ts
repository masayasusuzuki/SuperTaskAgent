// 設定ファイル読み込みユーティリティ

// 開発環境でのみ設定ファイルを読み込む
const getConfig = () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      // 動的インポートで設定ファイルを読み込み
      const config = require('../config/google-calendar-config.js');
      return config;
    } catch (error) {
      console.warn('設定ファイルが見つかりません。環境変数を使用します。');
      return {};
    }
  }
  return {};
};

// 環境変数または設定ファイルから値を取得
export const getEnvVar = (key: string): string | undefined => {
  // まず環境変数をチェック
  if (process.env[key]) {
    return process.env[key];
  }
  
  // 環境変数がない場合は設定ファイルから取得
  const config = getConfig();
  return config[key];
};

// Googleカレンダー設定の取得
export const getGoogleCalendarConfig = () => {
  return {
    clientId: getEnvVar('GOOGLE_CLIENT_ID'),
    clientSecret: getEnvVar('GOOGLE_CLIENT_SECRET'),
    redirectUri: getEnvVar('GOOGLE_REDIRECT_URI'),
    nextAuthUrl: getEnvVar('NEXTAUTH_URL'),
    nextAuthSecret: getEnvVar('NEXTAUTH_SECRET')
  };
};
