'use client';

import React, { useState } from 'react';
import { Search, RotateCcw, Trash2, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useTaskStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Task } from '@/types';
import { cn } from '@/lib/utils';

const CompletedTasks: React.FC = () => {
  const { 
    getCompletedTasksByDate, 
    getLabelById, 
    updateTask, 
    deleteTask 
  } = useTaskStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const completedTasksByDate = getCompletedTasksByDate();

  // 検索フィルター
  const filteredTasksByDate = Object.entries(completedTasksByDate).reduce((acc, [date, tasks]) => {
    const filteredTasks = tasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredTasks.length > 0) {
      acc[date] = filteredTasks;
    }
    
    return acc;
  }, {} as { [key: string]: Task[] });

  // タスクを復元（進行中に戻す）
  const restoreTask = (task: Task) => {
    const updatedTask = {
      ...task,
      status: 'in-progress' as const,
      completedAt: undefined,
      updatedAt: new Date()
    };
    updateTask(updatedTask);
  };

  // タスクを削除
  const removeTask = (taskId: string) => {
    deleteTask(taskId);
  };

  // 選択されたタスクを一括復元
  const restoreSelectedTasks = () => {
    const tasksToRestore = Array.from(selectedTasks).map(taskId => {
      const task = Object.values(completedTasksByDate)
        .flat()
        .find(t => t.id === taskId);
      return task;
    }).filter(Boolean) as Task[];

    tasksToRestore.forEach(task => {
      const updatedTask = {
        ...task,
        status: 'in-progress' as const,
        completedAt: undefined,
        updatedAt: new Date()
      };
      updateTask(updatedTask);
    });

    setSelectedTasks(new Set());
  };

  // 選択されたタスクを一括削除
  const removeSelectedTasks = () => {
    selectedTasks.forEach(taskId => {
      deleteTask(taskId);
    });
    setSelectedTasks(new Set());
  };

  // タスクの選択状態を切り替え
  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  // 全選択/全解除
  const toggleAllTasks = () => {
    const allTaskIds = Object.values(filteredTasksByDate)
      .flat()
      .map(task => task.id);
    
    if (selectedTasks.size === allTaskIds.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(allTaskIds));
    }
  };

  const totalCompletedTasks = Object.values(completedTasksByDate).flat().length;
  const filteredTasksCount = Object.values(filteredTasksByDate).flat().length;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* ヘッダー */}
      <div className="flex justify-between items-center p-6 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">完了タスク</h1>
          <p className="text-sm text-gray-600">
            完了したタスクの履歴 - {filteredTasksCount}件 / 総数: {totalCompletedTasks}件
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedTasks.size > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={restoreSelectedTasks}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <RotateCcw size={16} className="mr-1" />
                選択を復元 ({selectedTasks.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={removeSelectedTasks}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} className="mr-1" />
                選択を削除 ({selectedTasks.size})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="完了タスクを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllTasks}
            className="text-sm"
          >
            {selectedTasks.size === Object.values(filteredTasksByDate).flat().length ? '全解除' : '全選択'}
          </Button>
        </div>
      </div>

      {/* 完了タスク一覧 */}
      <div className="flex-1 p-6 overflow-y-auto">
        {Object.keys(filteredTasksByDate).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <CheckCircle size={48} className="mb-4 text-gray-300" />
            <p className="text-lg mb-2">
              {searchTerm ? '検索条件に一致する完了タスクがありません' : '完了したタスクがありません'}
            </p>
            <p className="text-sm text-gray-400">
              {searchTerm ? '検索条件を変更してください' : 'タスクを完了するとここに表示されます'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredTasksByDate).map(([date, tasks]) => {
              const dateObj = new Date(date);
              const isToday = format(new Date(), 'yyyy-MM-dd') === date;
              const isYesterday = format(new Date(Date.now() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd') === date;
              
              let dateLabel = format(dateObj, 'yyyy年M月d日 (E)', { locale: ja });
              if (isToday) dateLabel = '今日';
              if (isYesterday) dateLabel = '昨日';
              
              return (
                <div key={date} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* 日付ヘッダー */}
                  <div className={cn(
                    "px-4 py-3 border-b border-gray-200 flex items-center gap-2",
                    isToday && "bg-green-50 border-green-200",
                    isYesterday && "bg-blue-50 border-blue-200"
                  )}>
                    <Calendar size={16} className="text-gray-500" />
                    <span className="font-medium text-gray-900">{dateLabel}</span>
                    <span className="text-sm text-gray-500">({tasks.length}件)</span>
                  </div>
                  
                  {/* タスク一覧 */}
                  <div className="divide-y divide-gray-100">
                    {tasks.map((task) => {
                      const label = getLabelById(task.label);
                      const isSelected = selectedTasks.has(task.id);
                      
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "p-4 hover:bg-gray-50 transition-colors",
                            isSelected && "bg-blue-50"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* チェックボックス */}
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleTaskSelection(task.id)}
                              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            
                            {/* タスク情報 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-medium text-gray-900 truncate">
                                    {task.title}
                                  </h3>
                                  {task.description && (
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                  
                                  {/* タスクメタ情報 */}
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    {label && (
                                      <div className="flex items-center gap-1">
                                        <div 
                                          className="w-3 h-3 rounded-full"
                                          style={{ backgroundColor: label.color }}
                                        />
                                        <span>{label.name}</span>
                                      </div>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <span className="capitalize">
                                        {task.priority === 'high' ? '高' : 
                                         task.priority === 'medium' ? '中' : '低'}
                                      </span>
                                      優先度
                                    </span>
                                    <span>進捗: {task.progress}%</span>
                                                                         <span>
                                       完了: {format(
                                         task.completedAt instanceof Date 
                                           ? task.completedAt 
                                           : new Date(task.completedAt!), 
                                         'M/d H:mm', 
                                         { locale: ja }
                                       )}
                                     </span>
                                  </div>
                                </div>
                                
                                {/* アクションボタン */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => restoreTask(task)}
                                    className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                                    title="タスクを復元"
                                  >
                                    <RotateCcw size={16} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTask(task.id)}
                                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                    title="タスクを削除"
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedTasks;
