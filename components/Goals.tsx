'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Target, Clock, Heart, BookOpen } from 'lucide-react';
import { useTaskStore } from '@/store/useStore';
import { Goal, GoalType } from '@/types';
import GoalModal from './GoalModal';
import { Button } from '@/components/ui/button';

const Goals: React.FC = () => {
  const { 
    getCurrentMonthGoals, 
    getGoalProgress, 
    deleteGoal 
  } = useTaskStore();
  
  const currentGoals = getCurrentMonthGoals();
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  // 現在の年月を取得
  const currentDate = new Date();
  const yearMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;

  const handleAddGoal = () => {
    setEditingGoal(null);
    setShowModal(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowModal(true);
  };

  const handleDeleteGoal = (goalId: string) => {
    if (confirm('この目標を削除しますか？')) {
      deleteGoal(goalId);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGoal(null);
  };

  const getGoalIcon = (type: GoalType) => {
    switch (type) {
      case 'task':
        return <Target size={16} className="text-blue-600" />;
      case 'time':
        return <Clock size={16} className="text-green-600" />;
      case 'balance':
        return <Heart size={16} className="text-pink-600" />;
      case 'habit':
        return <BookOpen size={16} className="text-purple-600" />;
      default:
        return <Target size={16} className="text-gray-600" />;
    }
  };

  const getGoalTypeLabel = (type: GoalType) => {
    switch (type) {
      case 'task':
        return 'タスク系';
      case 'time':
        return '時間系';
      case 'balance':
        return 'バランス系';
      case 'habit':
        return '習慣系';
      default:
        return 'その他';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 80) return 'bg-blue-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* タイトル欄 */}
      <div className="flex justify-between items-center p-6 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">目標管理</h1>
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
                  const progress = getGoalProgress(goal.id, yearMonth);
                  return progress && progress.progressPercentage >= 100;
                }).length}
              </span>
              完了目標数
            </span>
          </div>
        </div>
        <Button onClick={handleAddGoal}>
          <Plus size={20} className="mr-2" />
          目標追加
        </Button>
      </div>

      {/* コンテンツエリア */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 月末目標設定の注意書き */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                重要: 月末に来月の目標を設定しましょう
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  毎月末に来月の目標を設定することで、計画的に目標達成を目指せます。
                  サボり防止のため、必ず月末に設定してください！
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 月間サマリー */}
        {currentGoals.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">月間サマリー</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 総目標数 */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {currentGoals.length}
                  </div>
                  <div className="text-sm text-gray-600">設定目標数</div>
                </div>
                
                {/* 平均達成率 */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {(() => {
                      const totalProgress = currentGoals.reduce((sum, goal) => {
                        const progress = getGoalProgress(goal.id, yearMonth);
                        return sum + (progress ? progress.progressPercentage : 0);
                      }, 0);
                      return (totalProgress / currentGoals.length).toFixed(1);
                    })()}%
                  </div>
                  <div className="text-sm text-gray-600">平均達成率</div>
                </div>
                
                {/* 完了目標数 */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {currentGoals.filter(goal => {
                      const progress = getGoalProgress(goal.id, yearMonth);
                      return progress && progress.progressPercentage >= 100;
                    }).length}
                  </div>
                  <div className="text-sm text-gray-600">完了目標数</div>
                </div>
              </div>
              
              {/* 目標タイプ別サマリー */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-4">目標タイプ別進捗</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(['task', 'time', 'balance', 'habit'] as GoalType[]).map(type => {
                    const typeGoals = currentGoals.filter(goal => goal.type === type);
                    if (typeGoals.length === 0) return null;
                    
                    const typeProgress = typeGoals.reduce((sum, goal) => {
                      const progress = getGoalProgress(goal.id, yearMonth);
                      return sum + (progress ? progress.progressPercentage : 0);
                    }, 0) / typeGoals.length;
                    
                    return (
                      <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          {getGoalIcon(type)}
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {typeProgress.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">
                          {getGoalTypeLabel(type)} ({typeGoals.length}件)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 現在の月間目標 */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月の目標
            </h2>
            <Button
              onClick={handleAddGoal}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={16} className="mr-2" />
              目標を追加
            </Button>
          </div>
          
          <div className="p-6">
            {currentGoals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">今月の目標が設定されていません</p>
                <Button
                  onClick={handleAddGoal}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus size={16} className="mr-2" />
                  目標を設定する
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {currentGoals.map((goal) => {
                  const progress = getGoalProgress(goal.id, yearMonth);
                  const progressPercentage = progress ? progress.progressPercentage : 0;
                  
                  return (
                    <div 
                      key={goal.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getGoalIcon(goal.type)}
                            <h3 className="font-medium text-gray-900">{goal.name}</h3>
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              {getGoalTypeLabel(goal.type)}
                            </span>
                          </div>
                          {goal.description && (
                            <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                          )}
                          
                          {/* 進捗バー */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">
                                {progress?.currentValue || 0} / {goal.targetValue} {goal.unit}
                              </span>
                              <span className="text-gray-600">{progressPercentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ease-out ${getProgressColor(progressPercentage)}`}
                                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                              />
                            </div>
                          </div>
                          
                          {/* 残り日数 */}
                          {progress && progress.remainingDays > 0 && (
                            <p className="text-xs text-gray-500">
                              残り {progress.remainingDays} 日
                            </p>
                          )}
                        </div>
                        
                        {/* アクションボタン */}
                        <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditGoal(goal)}
                            className="h-8 w-8 p-0 hover:bg-blue-50"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 目標設定モーダル */}
      <GoalModal
        isOpen={showModal}
        onClose={handleCloseModal}
        goal={editingGoal}
        yearMonth={yearMonth}
      />
    </div>
  );
};

export default Goals;
