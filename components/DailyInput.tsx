'use client';

import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useTaskStore } from '@/store/useStore';
import { DailyRecord } from '@/types';
import { Button } from '@/components/ui/button';

const DailyInput: React.FC = () => {
  const { 
    getCurrentMonthGoals, 
    getDailyRecordsByDate, 
    getGoalProgress,
    addDailyRecord, 
    updateDailyRecord 
  } = useTaskStore();
  
  const currentGoals = getCurrentMonthGoals();
  
  // 今日の日付を取得
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = getDailyRecordsByDate(today);
  
  // 入力フォームの状態
  const [formData, setFormData] = useState<{ [goalId: string]: number }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // フォームデータを初期化
  useEffect(() => {
    const initialData: { [goalId: string]: number } = {};
    currentGoals.forEach(goal => {
      const existingRecord = todayRecords.find(record => record.goalId === goal.id);
      initialData[goal.id] = existingRecord?.value || 0;
    });
    setFormData(initialData);
  }, [currentGoals, todayRecords]);

  const handleInputChange = (goalId: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [goalId]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // 各目標の実績を保存
      for (const goal of currentGoals) {
        const value = formData[goal.id] || 0;
        const existingRecord = todayRecords.find(record => record.goalId === goal.id);

        const recordData: DailyRecord = {
          id: existingRecord?.id || Date.now().toString() + goal.id,
          date: today,
          goalId: goal.id,
          value: value,
          notes: '',
          createdAt: existingRecord?.createdAt || new Date(),
          updatedAt: new Date()
        };

        if (existingRecord) {
          updateDailyRecord(recordData);
        } else {
          addDailyRecord(recordData);
        }
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-green-600';
    if (progress >= 80) return 'text-blue-600';
    if (progress >= 60) return 'text-yellow-600';
    if (progress >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressIcon = (progress: number) => {
    if (progress >= 100) return <CheckCircle size={16} className="text-green-600" />;
    if (progress >= 60) return <AlertCircle size={16} className="text-yellow-600" />;
    return <AlertCircle size={16} className="text-red-600" />;
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* タイトル欄 */}
      <div className="flex justify-between items-center p-6 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">日次入力</h1>
          <div className="flex gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {currentGoals.length}
              </span>
              設定目標数
            </span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                {currentGoals.filter(goal => {
                  const progress = getGoalProgress(goal.id, `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`);
                  return progress && progress.progressPercentage >= 100;
                }).length}
              </span>
              完了目標数
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('ja-JP', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* 今日の日付表示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-900">
            {new Date().toLocaleDateString('ja-JP', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </h2>
          <p className="text-blue-700 mt-1">今日の実績を記録しましょう</p>
        </div>

        {/* 日次入力フォーム */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">今日の実績入力</h3>
          </div>
          
          <div className="p-4 md:p-6">
            {currentGoals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">今月の目標が設定されていません</p>
                <p className="text-sm text-gray-400">
                  まずは目標画面で今月の目標を設定してください
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentGoals.map((goal) => {
                  const progress = getGoalProgress(goal.id, `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`);
                  const progressPercentage = progress ? progress.progressPercentage : 0;
                  const value = formData[goal.id] || 0;
                  
                  return (
                    <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{goal.name}</h4>
                          {goal.description && (
                            <p className="text-sm text-gray-600">{goal.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getProgressIcon(progressPercentage)}
                          <span className={`text-sm font-medium ${getProgressColor(progressPercentage)}`}>
                            {progressPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            placeholder="0"
                            value={value}
                            onChange={(e) => handleInputChange(goal.id, Number(e.target.value) || 0)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                          />
                          <span className="text-sm text-gray-600">{goal.unit}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          (目標: {goal.targetValue} {goal.unit})
                        </span>
                      </div>
                      
                      {/* 月間進捗バー */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">
                            月間: {progress?.currentValue || 0} / {goal.targetValue} {goal.unit}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full transition-all duration-300 ${getProgressColor(progressPercentage).replace('text-', 'bg-')}`}
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isSaving ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        保存中...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save size={16} />
                        今日の実績を保存
                      </div>
                    )}
                  </Button>
                  
                  {/* 保存ステータス */}
                  {saveStatus === 'success' && (
                    <div className="mt-2 text-center text-green-600 text-sm">
                      ✓ 実績が保存されました
                    </div>
                  )}
                  {saveStatus === 'error' && (
                    <div className="mt-2 text-center text-red-600 text-sm">
                      ✗ 保存に失敗しました
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 入力履歴 */}
        {todayRecords.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 mt-6">
            <div className="px-4 md:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">今日の入力履歴</h3>
            </div>
            
            <div className="p-4 md:p-6">
              <div className="space-y-2">
                {todayRecords.map((record) => {
                  const goal = currentGoals.find(g => g.id === record.goalId);
                  return (
                    <div key={record.id} className="flex items-center justify-between py-2">
                      <span className="text-gray-900">{goal?.name || '不明な目標'}</span>
                      <span className="text-gray-600">
                        {record.value} {goal?.unit || ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyInput;
