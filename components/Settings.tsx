'use client';

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Trash2, Download, Upload, HardDrive, AlertTriangle } from 'lucide-react';
import { useTaskStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';

export default function Settings() {
  const { tasks, labels, goals, dailyRecords, clearAllData } = useTaskStore();
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    total: 0,
    percentage: 0,
    tasksSize: 0,
    labelsSize: 0,
    goalsSize: 0,
    recordsSize: 0
  });

  // ローカルストレージの容量情報を取得
  const getStorageInfo = () => {
    if (typeof window === 'undefined') return;

    try {
      // 使用量を計算
      const tasksJson = JSON.stringify(tasks);
      const labelsJson = JSON.stringify(labels);
      const goalsJson = JSON.stringify(goals);
      const recordsJson = JSON.stringify(dailyRecords);
      
      const tasksSize = new Blob([tasksJson]).size;
      const labelsSize = new Blob([labelsJson]).size;
      const goalsSize = new Blob([goalsJson]).size;
      const recordsSize = new Blob([recordsJson]).size;
      
      const totalUsed = tasksSize + labelsSize + goalsSize + recordsSize;
      
      // ローカルストレージの総容量（通常5MB = 5,242,880 bytes）
      const totalStorage = 5 * 1024 * 1024; // 5MB in bytes
      
      setStorageInfo({
        used: totalUsed,
        total: totalStorage,
        percentage: Math.round((totalUsed / totalStorage) * 100),
        tasksSize,
        labelsSize,
        goalsSize,
        recordsSize
      });
    } catch (error) {
      console.error('Error calculating storage info:', error);
    }
  };

  useEffect(() => {
    getStorageInfo();
  }, [tasks, labels, goals, dailyRecords]);

  // データをエクスポート
  const exportData = () => {
    const data = {
      tasks,
      labels,
      goals,
      dailyRecords,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-management-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // データをインポート
  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            // データの検証と復元処理
            console.log('Imported data:', data);
            alert('データのインポート機能は開発中です');
          } catch (error) {
            alert('ファイルの読み込みに失敗しました');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // 全データを削除
  const handleClearAllData = () => {
    if (confirm('本当にすべてのデータを削除しますか？この操作は取り消せません。')) {
      clearAllData();
      getStorageInfo();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-orange-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStorageIcon = (percentage: number) => {
    if (percentage >= 90) return <AlertTriangle size={20} className="text-red-600" />;
    return <HardDrive size={20} className="text-gray-600" />;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <div className="flex justify-between items-center p-6 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">設定</h1>
          <p className="text-sm text-gray-600">
            アプリケーションの設定とデータ管理
          </p>
        </div>
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <SettingsIcon size={20} className="text-blue-600" />
        </div>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* ストレージ情報 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Database size={20} className="text-blue-600" />
                ストレージ情報
              </h2>
            </div>
            
            <div className="p-6">
              {/* 使用量サマリー */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStorageIcon(storageInfo.percentage)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">ローカルストレージ使用量</h3>
                      <p className="text-sm text-gray-600">
                        {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.total)}
                      </p>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${getStorageColor(storageInfo.percentage)}`}>
                    {storageInfo.percentage}%
                  </div>
                </div>
                
                {/* プログレスバー */}
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      storageInfo.percentage >= 90 ? 'bg-red-500' :
                      storageInfo.percentage >= 70 ? 'bg-orange-500' :
                      storageInfo.percentage >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
                  />
                </div>
                
                {storageInfo.percentage >= 90 && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    ストレージ容量が不足しています。古いデータを削除してください。
                  </p>
                )}
              </div>

              {/* 詳細内訳 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">タスク</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{tasks.length}件</span>
                    <span className="text-sm font-medium text-gray-900">{formatBytes(storageInfo.tasksSize)}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">ラベル</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{labels.length}件</span>
                    <span className="text-sm font-medium text-gray-900">{formatBytes(storageInfo.labelsSize)}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">目標</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{goals.length}件</span>
                    <span className="text-sm font-medium text-gray-900">{formatBytes(storageInfo.goalsSize)}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">日次記録</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{dailyRecords.length}件</span>
                    <span className="text-sm font-medium text-gray-900">{formatBytes(storageInfo.recordsSize)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* データ管理 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">データ管理</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={exportData}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download size={16} />
                  データをエクスポート
                </Button>
                
                <Button
                  onClick={importData}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Upload size={16} />
                  データをインポート
                </Button>
                
                <Button
                  onClick={handleClearAllData}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 size={16} />
                  全データ削除
                </Button>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p>• エクスポート: 現在のデータをJSONファイルとして保存</p>
                <p>• インポート: バックアップファイルからデータを復元（開発中）</p>
                <p>• 全データ削除: すべてのデータを完全に削除（取り消し不可）</p>
              </div>
            </div>
          </div>

          {/* アプリ情報 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">アプリ情報</h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">アプリ名</span>
                  <span className="font-medium">期日まもれる君</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">バージョン</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">データ保存方式</span>
                  <span className="font-medium">ローカルストレージ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">最大容量</span>
                  <span className="font-medium">5MB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
