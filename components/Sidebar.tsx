'use client';

import React from 'react';
import { List, BarChart3, Settings, Plus, Tag, Calendar, Bug, CheckCircle, Target, CalendarDays, Play } from 'lucide-react';
import { useTaskStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const {
    labels,
    currentView,
    selectedLabel,
    googleAuthToken,
    googleCalendars,
    setCurrentView,
    setSelectedLabel,
  } = useTaskStore();

  const menuItems = [
    { id: 'todo', label: 'Todo一覧', icon: List, badge: undefined },
    { id: 'gantt', label: 'ガントチャート', icon: BarChart3, badge: undefined },
    { 
      id: 'calendar', 
      label: 'カレンダー', 
      icon: Calendar,
      badge: googleAuthToken ? `${googleCalendars.length}連携` : undefined
    },
    { id: 'goals', label: '目標', icon: Target, badge: undefined },
    { id: 'daily-input', label: '日次入力', icon: CalendarDays, badge: undefined },
    { id: 'completed', label: '完了', icon: CheckCircle, badge: undefined },
    { id: 'youtube', label: 'YouTube', icon: Play, badge: undefined },
    { id: 'debug', label: 'デバッグ', icon: Bug, badge: undefined },
    { id: 'settings', label: '設定', icon: Settings, badge: undefined }
  ] as const;

  return (
    <div className="w-72 h-screen bg-gray-900 border-r border-gray-700 flex flex-col overflow-y-auto flex-shrink-0">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">期日まもれる君</h2>
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
                    "w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200",
                    currentView === item.id && "bg-blue-600 text-white border-r-2 border-blue-400 shadow-lg"
                  )}
                  onClick={() => setCurrentView(item.id)}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300">ラベル</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors duration-200"
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
                "w-full justify-start gap-2 h-8 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200",
                selectedLabel === null && "bg-blue-600 text-white shadow-md"
              )}
              onClick={() => setSelectedLabel(null)}
            >
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-sm">すべて</span>
            </Button>
          </li>
          {labels.map((label) => (
            <li key={label.id}>
              <Button
                variant={selectedLabel === label.id ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start gap-2 h-8 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200",
                  selectedLabel === label.id && "bg-blue-600 text-white shadow-md"
                )}
                onClick={() => setSelectedLabel(label.id)}
              >
                <div 
                  className="w-3 h-3 rounded-full shadow-sm"
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
