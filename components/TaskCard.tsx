'use client';

import React, { useState } from 'react';
import { MoreVertical, Calendar, Tag, CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Task } from '@/types';
import { useTaskStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  const { updateTask, deleteTask, getLabelById } = useTaskStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const label = getLabelById(task.label);
  
  // dueDateを確実にDateオブジェクトとして扱う
  const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
  const isOverdue = dueDate < new Date() && task.status !== 'completed';
  const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'in-progress':
        return <Clock size={20} className="text-blue-600" />;
      case 'on-hold':
        return <AlertCircle size={20} className="text-red-600" />;
      default:
        return <Circle size={20} className="text-gray-600" />;
    }
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return '#dc2626';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#059669';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (task.status) {
      case 'not-started':
        return '未着手';
      case 'in-progress':
        return '進行中';
      case 'completed':
        return '完了';
      case 'on-hold':
        return '保留';
      default:
        return '未着手';
    }
  };

  const getPriorityText = () => {
    switch (task.priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '中';
    }
  };

  const handleStatusChange = () => {
    const statuses: Task['status'][] = ['not-started', 'in-progress', 'completed', 'on-hold'];
    const currentIndex = statuses.indexOf(task.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    const newStatus = statuses[nextIndex];
    
    // タスクを更新
    const updatedTask = { 
      ...task, 
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date() : undefined
    };
    updateTask(updatedTask);
    
    // 自動更新機能を無効化（コメントアウト）
    // if (newStatus === 'completed') {
    //   updateGoalProgressFromTask(updatedTask);
    // }
  };

  // タスク完了時に目標の進捗を自動更新
  const updateGoalProgressFromTask = (completedTask: Task) => {
    const { getCurrentMonthGoals, getDailyRecordsByDate, addDailyRecord, updateDailyRecord } = useTaskStore.getState();
    const currentGoals = getCurrentMonthGoals();
    
    // タスク系の目標を探す
    const taskGoals = currentGoals.filter(goal => goal.type === 'task');
    
    if (taskGoals.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const todayRecords = getDailyRecordsByDate(today);
      
      // 各タスク系目標に対して完了タスク数を更新
      taskGoals.forEach(goal => {
        const existingRecord = todayRecords.find(record => record.goalId === goal.id);
        const currentValue = existingRecord?.value || 0;
        
        const recordData = {
          id: existingRecord?.id || Date.now().toString() + goal.id,
          date: today,
          goalId: goal.id,
          value: currentValue + 1, // 完了タスク数を1増やす
          notes: `タスク完了: ${completedTask.title}`,
          createdAt: existingRecord?.createdAt || new Date(),
          updatedAt: new Date()
        };
        
        if (existingRecord) {
          updateDailyRecord(recordData);
        } else {
          addDailyRecord(recordData);
        }
      });
    }
  };

  const handleProgressChange = (progress: number) => {
    updateTask({ ...task, progress });
  };

  const handleDelete = () => {
    deleteTask(task.id);
    setShowMenu(false);
  };

  return (
    <div className={cn(
      "task-card",
      task.status === 'completed' && "completed",
      isOverdue && "overdue"
    )}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 mr-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{task.title}</h3>
          {isOverdue && (
            <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
              締切
            </span>
          )}
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={16} />
          </Button>
          {showMenu && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
              <button
                onClick={onEdit}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                編集
              </button>
              <button
                onClick={handleDelete}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                削除
              </button>
            </div>
          )}
        </div>
      </div>

      {task.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{task.description}</p>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={16} />
          <span className={isOverdue ? "text-red-600" : ""}>
            {format(dueDate, 'M月d日', { locale: ja })}
            {daysUntilDue > 0 && ` (${daysUntilDue}日前)`}
            {daysUntilDue < 0 && ` (${Math.abs(daysUntilDue)}日超過)`}
          </span>
        </div>

        {label && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Tag size={16} />
            <span
              className="px-2 py-1 text-xs font-semibold text-white rounded"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStatusChange}
            className="flex items-center gap-2 text-sm"
          >
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </Button>
          
          {/* 完了ボタン - 完了状態でない場合のみ表示 */}
          {task.status !== 'completed' ? (
            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                setIsCompleting(true);
                const updatedTask = { 
                  ...task, 
                  status: 'completed' as const,
                  progress: 100,
                  completedAt: new Date()
                };
                updateTask(updatedTask);
                // 自動更新機能を無効化（コメントアウト）
                // updateGoalProgressFromTask(updatedTask);
                
                // 少し待ってから完了状態をリセット
                setTimeout(() => {
                  setIsCompleting(false);
                }, 1000);
              }}
              disabled={isCompleting}
              className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white transition-all duration-200 hover:scale-105"
                          >
                <CheckCircle size={16} />
                {isCompleting ? '完了中...' : '完了'}
              </Button>
          ) : (
            <span className="flex items-center gap-2 text-sm text-green-600 font-medium">
              <CheckCircle size={16} />
              完了済み
            </span>
          )}
        </div>

        <span
          className="px-2 py-1 text-xs font-semibold text-white rounded"
          style={{ backgroundColor: getPriorityColor() }}
        >
          {getPriorityText()}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>進捗</span>
          <span>{task.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${task.progress}%` }}
          />
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={task.progress}
          onChange={(e) => handleProgressChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
};

export default TaskCard;
