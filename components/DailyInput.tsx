'use client';

import React, { useState } from 'react';
import { Save, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useTaskStore } from '@/store/useStore';
import { DailyRecord } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DailyInput: React.FC = () => {
  const { 
    getCurrentMonthGoals, 
    getDailyRecordsByDate, 
    getGoalProgress,
    addDailyRecord, 
    updateDailyRecord 
  } = useTaskStore();
  
  const currentGoals = getCurrentMonthGoals();
  
  // シンプルな状態管理
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // 入力値の変更処理
  const handleInputChange = (goalId: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [goalId]: value
    }));
  };

  // 保存処理
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      for (const goal of currentGoals) {
        const value = Number(inputValues[goal.id] || 0);
        const existingRecord = getDailyRecordsByDate(selectedDate).find(record => record.goalId === goal.id);

        const recordData: DailyRecord = {
          id: existingRecord?.id || Date.now().toString() + goal.id,
          date: selectedDate,
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
    } catch (error) {
      console.error('保存エラー:', error);
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <label htmlFor="date-select" className="text-sm text-gray-700 font-medium">記録日付</label>
          </div>
          <Input
            id="date-select"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-48 text-sm"
            max={new Date().toLocaleDateString('en-CA')}
          />
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* 選択された日付表示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-900">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ja-JP', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </h2>
          <p className="text-blue-700 mt-1">
            {selectedDate === new Date().toLocaleDateString('en-CA') 
              ? '今日の実績を記録しましょう' 
              : 'この日の実績を記録しましょう'
            }
          </p>
        </div>

        {/* 日次入力フォーム */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedDate === new Date().toLocaleDateString('en-CA') ? '今日の実績入力' : 'この日の実績入力'}
            </h3>
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
                  
                  return (
                    <div key={goal.id} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      {/* ヘッダー部分 */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">{goal.name}</h4>
                          {goal.description && (
                            <p className="text-sm text-gray-600">{goal.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm">
                          {getProgressIcon(progressPercentage)}
                          <span className={`text-sm font-bold ${getProgressColor(progressPercentage)}`}>
                            {progressPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      {/* 入力部分 */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium text-gray-700">実績入力</label>
                          <span className="text-sm text-gray-500">
                            目標: <span className="font-semibold text-blue-600">{goal.targetValue} {goal.unit}</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <input
                              type="number"
                              placeholder="0"
                              value={inputValues[goal.id] || ''}
                              onChange={(e) => handleInputChange(goal.id, e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              step="0.1"
                            />
                          </div>
                          <div className="text-lg font-semibold text-gray-700 min-w-[60px]">
                            {goal.unit}
                          </div>
                        </div>
                        
                        {/* 目標との比較 */}
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            入力値: <span className="font-semibold text-gray-900">{inputValues[goal.id] ? Number(inputValues[goal.id]) : 0}</span> / {goal.targetValue}
                          </span>
                          <span className={`font-semibold ${(inputValues[goal.id] ? Number(inputValues[goal.id]) : 0) >= goal.targetValue ? 'text-green-600' : 'text-orange-600'}`}>
                            {(inputValues[goal.id] ? Number(inputValues[goal.id]) : 0) >= goal.targetValue ? '✓ 目標達成！' : `${goal.targetValue - (inputValues[goal.id] ? Number(inputValues[goal.id]) : 0)} 残り`}
                          </span>
                        </div>
                      </div>
                      
                      {/* 月間進捗バー */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">月間進捗</span>
                          <span className="text-sm text-gray-600">
                            {progress?.currentValue || 0} / {goal.targetValue} {goal.unit}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(progressPercentage).replace('text-', 'bg-')}`}
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          残り {progress ? Math.max(0, goal.targetValue - (progress.currentValue + (inputValues[goal.id] ? Number(inputValues[goal.id]) : 0))) : goal.targetValue} {goal.unit}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-6">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isSaving ? (
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        保存中...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Save size={20} />
                        {selectedDate === new Date().toLocaleDateString('en-CA') ? '今日の実績を保存' : 'この日の実績を保存'}
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 入力履歴 */}
        {getDailyRecordsByDate(selectedDate).length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 mt-6">
            <div className="px-4 md:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedDate === new Date().toLocaleDateString('en-CA') ? '今日の入力履歴' : 'この日の入力履歴'}
              </h3>
            </div>
            
            <div className="p-4 md:p-6">
              <div className="space-y-2">
                {getDailyRecordsByDate(selectedDate).map((record) => {
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
