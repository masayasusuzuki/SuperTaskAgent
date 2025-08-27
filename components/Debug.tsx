'use client';

import React, { useState } from 'react';
import { useTaskStore, DebugInfo } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Trash2, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function Debug() {
  const { debugHistory, clearDebugHistory, addDebugInfo } = useTaskStore();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // フィルタリングされたデバッグ履歴
  const filteredHistory = debugHistory.filter(info => {
    if (filterType !== 'all' && info.type !== filterType) return false;
    if (filterStatus !== 'all' && info.status !== filterStatus) return false;
    return true;
  });

  // デバッグ情報をエクスポート
  const exportDebugData = () => {
    const dataStr = JSON.stringify(debugHistory, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-history-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // テスト用デバッグ情報を追加
  const addTestDebugInfo = () => {
    addDebugInfo({
      type: 'general',
      title: 'テストデバッグ情報',
      data: { message: 'これはテスト用のデバッグ情報です', timestamp: new Date().toISOString() },
      status: 'info'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'google_calendar': return 'text-purple-600 bg-purple-50';
      case 'gantt_chart': return 'text-orange-600 bg-orange-50';
      case 'todo': return 'text-blue-600 bg-blue-50';
      case 'general': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'google_calendar': return 'Googleカレンダー';
      case 'gantt_chart': return 'ガントチャート';
      case 'todo': return 'Todo';
      case 'general': return '一般';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success': return '成功';
      case 'error': return 'エラー';
      case 'warning': return '警告';
      case 'info': return '情報';
      default: return status;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">デバッグ情報</h1>
            <p className="text-sm text-gray-600 mt-1">
              アプリケーションの動作履歴とデバッグ情報を表示します
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addTestDebugInfo}
            >
              テスト追加
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportDebugData}
            >
              <Download size={16} className="mr-2" />
              エクスポート
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearDebugHistory}
            >
              <Trash2 size={16} className="mr-2" />
              クリア
            </Button>
          </div>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">フィルター:</span>
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">すべてのタイプ</option>
            <option value="google_calendar">Googleカレンダー</option>
            <option value="gantt_chart">ガントチャート</option>
            <option value="todo">Todo</option>
            <option value="general">一般</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">すべてのステータス</option>
            <option value="success">成功</option>
            <option value="error">エラー</option>
            <option value="warning">警告</option>
            <option value="info">情報</option>
          </select>

          <span className="text-sm text-gray-500">
            {filteredHistory.length} / {debugHistory.length} 件
          </span>
        </div>
      </div>

      {/* デバッグ履歴 */}
      <div className="flex-1 overflow-auto p-6">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">デバッグ情報がありません</div>
            <p className="text-sm text-gray-500">
              アプリケーションの操作を行うと、ここにデバッグ情報が表示されます
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((info) => (
              <div
                key={info.id}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(info.type)}`}>
                      {getTypeLabel(info.type)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(info.status)}`}>
                      {getStatusLabel(info.status)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(info.timestamp), 'yyyy/MM/dd HH:mm:ss', { locale: ja })}
                  </span>
                </div>

                <h3 className="font-medium text-gray-900 mb-2">{info.title}</h3>

                <div className="bg-gray-50 rounded p-3">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(info.data, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
