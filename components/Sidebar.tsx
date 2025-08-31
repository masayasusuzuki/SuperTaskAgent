'use client';

import React from 'react';
import { List, BarChart3, Settings, Plus, Tag, Calendar, Bug, CheckCircle, Target, CalendarDays, PieChart } from 'lucide-react';
import { useTaskStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const {
    labels,
    currentView,
    selectedLabel,
    setCurrentView,
    setSelectedLabel,
  } = useTaskStore();

  const menuItems = [
    { id: 'todo', label: 'Todo一覧', icon: List },
    { id: 'gantt', label: 'ガントチャート', icon: BarChart3 },
    { id: 'calendar', label: 'カレンダー', icon: Calendar },
    { id: 'goals', label: '目標', icon: Target },
    { id: 'daily-input', label: '日次入力', icon: CalendarDays },
    { id: 'completed', label: '完了', icon: CheckCircle },
    { id: 'debug', label: 'デバッグ', icon: Bug },
    { id: 'stats', label: '統計・レポート', icon: PieChart },
    { id: 'settings', label: '設定', icon: Settings }
  ] as const;

  return (
    <div className="w-72 h-screen bg-white border-r border-gray-200 flex flex-col overflow-y-auto flex-shrink-0">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">期日まもれる君</h2>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Button
                  variant={currentView === item.id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    currentView === item.id && "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  )}
                  onClick={() => setCurrentView(item.id)}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">ラベル</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => {/* TODO: ラベル追加モーダル */}}
          >
            <Plus size={16} />
          </Button>
        </div>
        
        <ul className="space-y-1">
          <li>
            <Button
              variant={selectedLabel === null ? "default" : "ghost"}
              size="sm"
              className={cn(
                "w-full justify-start gap-2 h-8",
                selectedLabel === null && "bg-blue-50 text-blue-700"
              )}
              onClick={() => setSelectedLabel(null)}
            >
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-sm">すべて</span>
            </Button>
          </li>
          {labels.map((label) => (
            <li key={label.id}>
              <Button
                variant={selectedLabel === label.id ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start gap-2 h-8",
                  selectedLabel === label.id && "bg-blue-50 text-blue-700"
                )}
                onClick={() => setSelectedLabel(label.id)}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: label.color }}
                ></div>
                <span className="text-sm">{label.name}</span>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
