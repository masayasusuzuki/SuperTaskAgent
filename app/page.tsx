'use client';

import React, { useEffect, useState } from 'react';
import { useTaskStore } from '@/store/useStore';
import Sidebar from '@/components/Sidebar';
import TodoList from '@/components/TodoList';
import GanttChart from '@/components/GanttChart';
import Calendar from '@/components/Calendar';
import Goals from '@/components/Goals';
import DailyInput from '@/components/DailyInput';
import Stats from '@/components/Stats';
import CompletedTasks from '@/components/CompletedTasks';
import Settings from '@/components/Settings';
import Debug from '@/components/Debug';
import { storage } from '@/lib/storage';

export default function Home() {
  const [isInitialized, setIsInitialized] = useState(false);
  const {
    tasks,
    labels,
    currentView,
    setTasks,
    setLabels,
  } = useTaskStore();

  // 初期データの読み込み（初回のみ）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTasks = storage.getTasks();
      const savedLabels = storage.getLabels();

      if (savedTasks.length > 0) {
        setTasks(savedTasks);
      }
      if (savedLabels.length > 0) {
        setLabels(savedLabels);
      }

      setIsInitialized(true);
    }
  }, [setTasks, setLabels]);

  // データの保存
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      storage.saveTasks(tasks);
    }
  }, [tasks, isInitialized]);

  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      storage.saveLabels(labels);
    }
  }, [labels, isInitialized]);

  // 現在のビューに基づいてコンポーネントを選択
  const renderCurrentView = () => {
    switch (currentView) {
      case 'todo':
        return <TodoList />;
      case 'gantt':
        return <GanttChart />;
      case 'calendar':
        return <Calendar />;
      case 'goals':
        return <Goals />;
      case 'daily-input':
        return <DailyInput />;
      case 'stats':
        return <Stats />;
      case 'completed':
        return <CompletedTasks />;
      case 'settings':
        return <Settings />;
      case 'debug':
        return <Debug />;
      default:
        return <TodoList />;
    }
  };

  // 初期化が完了するまでローディングを表示
  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {renderCurrentView()}
      </main>
    </div>
  );
}
