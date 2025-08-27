'use client';

import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useTaskStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { Task } from '@/types';

const TodoList: React.FC = () => {
  const {
    tasks,
    labels,
    filters,
    sortBy,
    sortOrder,
    setFilters,
    setSortBy,
    setSortOrder,
    getFilteredTasks,
  } = useTaskStore();

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // フィルタリングとソート
  const filteredTasks = getFilteredTasks();
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'dueDate':
        const aDueDate = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate);
        const bDueDate = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate);
        comparison = aDueDate.getTime() - bDueDate.getTime();
        break;
      case 'createdAt':
        const aCreatedAt = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const bCreatedAt = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        comparison = aCreatedAt.getTime() - bCreatedAt.getTime();
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters({ ...filters, search: value });
  };

  const handleStatusFilter = (status: Task['status'] | '') => {
    setFilters({ ...filters, status: status || undefined });
  };

  const handlePriorityFilter = (priority: Task['priority'] | '') => {
    setFilters({ ...filters, priority: priority || undefined });
  };

  const handleSort = (newSortBy: string) => {
    const newSortOrder = sortBy === newSortBy && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(newSortBy as any);
    setSortOrder(newSortOrder);
  };

  const openTaskModal = (task?: Task) => {
    setEditingTask(task || null);
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleTaskSave = (task: Task) => {
    // タスク保存後の処理
    closeTaskModal();
    
    // ガントチャートへの反映を確実にするため、少し待ってから更新
    setTimeout(() => {
      // ストアの更新を強制
      const currentTasks = useTaskStore.getState().tasks;
      useTaskStore.setState({ tasks: [...currentTasks] });
    }, 100);
  };

  const statusCounts = {
    'not-started': tasks.filter(t => t.status === 'not-started').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    'completed': tasks.filter(t => t.status === 'completed').length,
    'on-hold': tasks.filter(t => t.status === 'on-hold').length
  };

  const getLabelById = (id: string) => {
    return labels.find(label => label.id === id);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <div className="flex justify-between items-center p-6 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Todo一覧</h1>
          <div className="flex gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 bg-gray-500 text-white text-xs rounded-full flex items-center justify-center">
                {statusCounts['not-started']}
              </span>
              未着手
            </span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {statusCounts['in-progress']}
              </span>
              進行中
            </span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {statusCounts['on-hold']}
              </span>
              保留
            </span>
            <span className="flex items-center gap-1 text-green-600">
              <span className="w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                {statusCounts['completed']}
              </span>
              完了
              <span className="text-xs text-gray-400 ml-1">(完了ページ)</span>
            </span>
          </div>
        </div>
        <Button onClick={() => openTaskModal()}>
          <Plus size={20} className="mr-2" />
          タスク追加
        </Button>
      </div>

      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="タスクを検索..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">状態:</label>
            <Select
              value={filters.status || ''}
              onChange={(e) => handleStatusFilter(e.target.value as Task['status'] || '')}
              className="w-32"
            >
              <option value="">すべて</option>
              <option value="not-started">未着手</option>
              <option value="in-progress">進行中</option>
              <option value="on-hold">保留</option>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">優先度:</label>
            <Select
              value={filters.priority || ''}
              onChange={(e) => handlePriorityFilter(e.target.value as Task['priority'] || '')}
              className="w-32"
            >
              <option value="">すべて</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">ソート:</label>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy] = e.target.value.split('-');
                handleSort(newSortBy);
              }}
              className="w-40"
            >
              <option value="dueDate-asc">締切日（昇順）</option>
              <option value="dueDate-desc">締切日（降順）</option>
              <option value="createdAt-asc">作成日（昇順）</option>
              <option value="createdAt-desc">作成日（降順）</option>
              <option value="priority-desc">優先度（高→低）</option>
              <option value="priority-asc">優先度（低→高）</option>
              <option value="title-asc">タイトル（昇順）</option>
              <option value="title-desc">タイトル（降順）</option>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {sortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p className="text-lg mb-4">タスクがありません</p>
            <Button onClick={() => openTaskModal()}>最初のタスクを作成</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ラベルごとにグループ化 */}
            {(() => {
              // ラベルごとにタスクをグループ化
              const tasksByLabel: { [key: string]: Task[] } = {};
              
              sortedTasks.forEach(task => {
                const labelId = task.label || 'unlabeled';
                if (!tasksByLabel[labelId]) {
                  tasksByLabel[labelId] = [];
                }
                tasksByLabel[labelId].push(task);
              });
              
              return Object.entries(tasksByLabel).map(([labelId, labelTasks]) => {
                const label = getLabelById(labelId);
                const labelName = label ? label.name : (labelId === 'unlabeled' ? '未分類' : `ラベル${labelId}`);
                
                return (
                  <div key={labelId} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* ラベルヘッダー */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        {label && (
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          {labelName} ({labelTasks.length}件)
                        </span>
                      </div>
                    </div>
                    
                    {/* タスク一覧 */}
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {labelTasks.map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onEdit={() => openTaskModal(task)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          onSave={handleTaskSave}
          onClose={closeTaskModal}
        />
      )}
    </div>
  );
};

export default TodoList;
