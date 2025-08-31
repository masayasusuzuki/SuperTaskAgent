'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { googleCalendarClientService } from '@/lib/googleCalendarClient';
import { useTaskStore } from '@/store/useStore';

interface DebugInfo {
  code?: string;
  error?: string;
  url?: string;
  tokens?: string;
  calendars?: number;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const { setGoogleAuthToken, setGoogleRefreshToken, setGoogleTokenExpiry, setGoogleCalendars, addDebugInfo, setCurrentView } = useTaskStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        setDebugInfo({
          code: code ? 'あり' : 'なし',
          error: error || 'なし',
          url: window.location.href
        });

        // デバッグ情報をストアに保存
        addDebugInfo({
          type: 'google_calendar',
          title: 'Google認証コールバック開始',
          data: { code: !!code, error, url: window.location.href },
          status: 'info'
        });

        if (error) {
          setStatus('error');
          setMessage('認証に失敗しました: ' + error);
          
          addDebugInfo({
            type: 'google_calendar',
            title: 'Google認証エラー',
            data: { error },
            status: 'error'
          });
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('認証コードが見つかりません');
          
          addDebugInfo({
            type: 'google_calendar',
            title: 'Google認証コードなし',
            data: { url: window.location.href },
            status: 'error'
          });
          return;
        }

        // アクセストークンを取得
        console.log('Getting tokens from code...');
        const tokens = await googleCalendarClientService.getTokensFromCode(code);
        console.log('Tokens received:', tokens);
        
        setDebugInfo((prev: DebugInfo) => ({ ...prev, tokens: tokens ? '取得成功' : '取得失敗' }));
        
        if (tokens.access_token) {
          // トークンを保存
          setGoogleAuthToken(tokens.access_token);
          setGoogleRefreshToken(tokens.refresh_token || null);
          setGoogleTokenExpiry(tokens.expiry_date || null);
          
          // カレンダーリストを取得
          console.log('Getting calendar list...');
          const calendars = await googleCalendarClientService.getCalendarList(tokens.access_token);
          console.log('Calendars received:', calendars);
          
          setGoogleCalendars(calendars);
          
          // カレンダービューに切り替え
          setCurrentView('calendar');
          setDebugInfo((prev: DebugInfo) => ({ ...prev, calendars: calendars.length }));
          
          setStatus('success');
          setMessage('Googleカレンダーとの連携が完了しました');
          
          addDebugInfo({
            type: 'google_calendar',
            title: 'Google認証成功',
            data: { 
              tokenLength: tokens.access_token.length,
              calendarCount: calendars.length,
              calendars: calendars.map((cal: any) => ({ id: cal.id, name: cal.summary }))
            },
            status: 'success'
          });
          
          // 3秒後にホームページにリダイレクト
          setTimeout(() => {
            router.push('/');
          }, 3000);
        } else {
          setStatus('error');
          setMessage('アクセストークンの取得に失敗しました');
          
          addDebugInfo({
            type: 'google_calendar',
            title: 'Googleトークン取得失敗',
            data: { tokens },
            status: 'error'
          });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('認証処理中にエラーが発生しました');
        
        addDebugInfo({
          type: 'google_calendar',
          title: 'Google認証処理エラー',
          data: { error: error instanceof Error ? error.message : 'Unknown error' },
          status: 'error'
        });
      }
    };

    handleAuthCallback();
  }, [router, setGoogleAuthToken, setGoogleRefreshToken, setGoogleTokenExpiry, setGoogleCalendars, addDebugInfo, setCurrentView]);

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        {/* デバッグ情報 */}
        <div className="mb-4 p-4 bg-gray-100 rounded-lg text-left">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">デバッグ情報</h3>
          <div className="text-xs space-y-1">
            <div><strong>コード:</strong> {debugInfo.code || '不明'}</div>
            <div><strong>エラー:</strong> {debugInfo.error || 'なし'}</div>
            <div><strong>トークン:</strong> {debugInfo.tokens || '不明'}</div>
            <div><strong>カレンダー数:</strong> {debugInfo.calendars || '不明'}</div>
          </div>
        </div>
        {status === 'loading' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">認証中...</h2>
            <p className="text-gray-600">Googleカレンダーとの連携を設定しています</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">連携完了</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-2">カレンダーページに移動します...</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">エラー</h2>
            <p className="text-gray-600">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              ホームに戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
