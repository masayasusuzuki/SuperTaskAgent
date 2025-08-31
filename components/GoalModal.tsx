'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Goal, GoalType } from '@/types';
import { useTaskStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: Goal | null;
  yearMonth: string;
}

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, goal, yearMonth }) => {
  const { addGoal, updateGoal } = useTaskStore();
  const [formData, setFormData] = useState({
    name: '',
    type: 'task' as GoalType,
    targetValue: 0,
    unit: '',
    description: '',
    isActive: true
  });

  // デフォルト目標テンプレート
  const defaultGoals = [
    { name: '学習時間', type: 'time' as GoalType, targetValue: 40, unit: '時間', description: '新しいスキルや知識の習得時間' },
    { name: '運動頻度', type: 'habit' as GoalType, targetValue: 12, unit: '回', description: '週3回の運動習慣' },
    { name: '読書冊数', type: 'habit' as GoalType, targetValue: 3, unit: '冊', description: 'ビジネス書、自己啓発書、専門書' },
    { name: '睡眠時間', type: 'habit' as GoalType, targetValue: 210, unit: '時間', description: '質の高い睡眠時間の確保（7時間/日）' },
    { name: '瞑想・マインドフルネス', type: 'habit' as GoalType, targetValue: 20, unit: '回', description: '毎日10-15分の瞑想習慣' },
    { name: '創造的活動時間', type: 'time' as GoalType, targetValue: 15, unit: '時間', description: 'アイデア出し、企画、創作活動' },
    { name: '副業収入', type: 'task' as GoalType, targetValue: 10, unit: '万円', description: '副業収入の日別計算(概算)' },
    { name: '半日断食', type: 'habit' as GoalType, targetValue: 20, unit: '日', description: '半日断食を実行した回数' }
  ];

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        type: goal.type,
        targetValue: goal.targetValue,
        unit: goal.unit,
        description: goal.description || '',
        isActive: goal.isActive
      });
    } else {
      setFormData({
        name: '',
        type: 'task',
        targetValue: 0,
        unit: '',
        description: '',
        isActive: true
      });
    }
  }, [goal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const goalData: Goal = {
      id: goal?.id || Date.now().toString(),
      name: formData.name,
      type: formData.type,
      targetValue: formData.targetValue,
      unit: formData.unit,
      description: formData.description,
      isActive: formData.isActive,
      yearMonth: yearMonth,
      createdAt: goal?.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (goal) {
      updateGoal(goalData);
    } else {
      addGoal(goalData);
    }

    onClose();
  };

  const handleTemplateSelect = (template: typeof defaultGoals[0]) => {
    setFormData({
      name: template.name,
      type: template.type,
      targetValue: template.targetValue,
      unit: template.unit,
      description: template.description,
      isActive: true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {goal ? '目標を編集' : '新しい目標を設定'}
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
          {/* テンプレート選択 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">テンプレートから選択</h3>
            <div className="grid grid-cols-2 gap-2">
              {defaultGoals.map((template, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className="text-left p-2 border border-gray-200 rounded-md hover:bg-gray-50 text-sm"
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-gray-600">{template.targetValue} {template.unit}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 目標名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目標名 *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例: タスク完了数"
              required
            />
          </div>

          {/* 目標タイプ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目標タイプ *
            </label>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as GoalType })}
              required
            >
              <option value="task">タスク系</option>
              <option value="time">時間系</option>
              <option value="balance">ライフワークバランス系</option>
              <option value="habit">習慣系</option>
            </Select>
          </div>

          {/* 目標値と単位 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目標値 *
              </label>
              <Input
                type="number"
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                placeholder="50"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                単位 *
              </label>
              <Input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="個、時間、回、冊など"
                required
              />
            </div>
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              説明
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="目標の詳細な説明を入力してください"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* アクティブ状態 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              この目標をアクティブにする
            </label>
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {goal ? '更新' : '作成'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalModal;
