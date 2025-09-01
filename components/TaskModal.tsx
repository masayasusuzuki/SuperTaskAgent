'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Task } from '@/types';
import { useTaskStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface TaskModalProps {
  task?: Task | null;
  onSave: (task: Task) => void;
  onClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, onSave, onClose }) => {
  const { labels, addTask, updateTask } = useTaskStore();
  // 今日の日付を取得
  const getToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'not-started' as Task['status'],
    priority: 'medium' as Task['priority'],
    label: '',
    startDate: getToday(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間後
    progress: 0
  });

  const [isAllDay, setIsAllDay] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        label: task.label,
        startDate: task.startDate,
        dueDate: task.dueDate,
        progress: task.progress
      });
      
      // 開始日と終了日が同じ場合は終日チェックを有効にする
      const startDateStr = task.startDate.toISOString().split('T')[0];
      const dueDateStr = task.dueDate.toISOString().split('T')[0];
      setIsAllDay(startDateStr === dueDateStr);
    }
  }, [task]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    }

    if (formData.startDate > formData.dueDate) {
      newErrors.dueDate = '終了日は開始日より後である必要があります';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const taskData: Task = {
      id: task?.id || uuidv4(),
      ...formData,
      createdAt: task?.createdAt || new Date(),
      updatedAt: new Date(),
      // 完了状態になった場合、完了日時を設定
      completedAt: formData.status === 'completed' ? new Date() : task?.completedAt
    };

    if (task) {
      updateTask(taskData);
    } else {
      addTask(taskData);
    }

    onSave(taskData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDateChange = (field: 'startDate' | 'dueDate', value: string) => {
    const date = new Date(value);
    handleInputChange(field, date);
    
    // 終日チェックが有効な場合、開始日を変更したら終了日も同じ日に設定
    if (field === 'startDate' && isAllDay) {
      handleInputChange('dueDate', date);
    }
  };

  const handleAllDayChange = (checked: boolean) => {
    setIsAllDay(checked);
    if (checked) {
      // 終日チェックが有効になった場合、終了日を開始日と同じ日に設定
      handleInputChange('dueDate', formData.startDate);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'タスクを編集' : '新しいタスクを作成'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              タイトル *
            </label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="タスクのタイトルを入力"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              説明
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="タスクの詳細を入力"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                状態
              </label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="not-started">未着手</option>
                <option value="in-progress">進行中</option>
                <option value="completed">完了</option>
                <option value="on-hold">保留</option>
              </Select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                優先度
              </label>
              <Select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </Select>
            </div>
          </div>

          <div>
            <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-2">
              ラベル
            </label>
            <Select
              id="label"
              value={formData.label}
              onChange={(e) => handleInputChange('label', e.target.value)}
            >
              <option value="">ラベルを選択</option>
              {labels.map(label => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                開始日
              </label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                終了日 *
              </label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('dueDate', e.target.value)}
                className={errors.dueDate ? 'border-red-500' : ''}
              />
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
              )}
            </div>
          </div>

          {/* 終日チェックボックス */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <input
              id="allDay"
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => handleAllDayChange(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="allDay" className="text-sm font-medium text-gray-700">
              終日タスク（その日中に完了）
            </label>
            {isAllDay && (
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                開始日と同じ日に設定されます
              </span>
            )}
          </div>

          <div>
            <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-2">
              進捗 ({formData.progress}%)
            </label>
            <input
              id="progress"
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => handleInputChange('progress', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              キャンセル
            </Button>
            <Button type="submit">
              {task ? '更新' : '作成'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
