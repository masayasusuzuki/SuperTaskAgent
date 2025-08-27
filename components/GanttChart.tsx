'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Edit3, Save, X } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays, addWeeks, subWeeks, isToday, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useTaskStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function GanttChart() {
  const { tasks, labels, getLabelById } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [memo, setMemo] = useState('');
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [editMemoText, setEditMemoText] = useState('');

  // localStorageからのデータ読み込み確認
  useEffect(() => {
    const checkDataLoaded = () => {
      if (tasks.length > 0 || labels.length > 0) {
        setIsDataLoaded(true);
      } else {
        // データがまだ読み込まれていない場合、少し待ってから再確認
        setTimeout(() => {
          setIsDataLoaded(true);
        }, 100);
      }
    };

    checkDataLoaded();
  }, [tasks, labels]);

  // localStorageからのメモ読み込み
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMemo = localStorage.getItem('gantt-memo');
      if (savedMemo) {
        setMemo(savedMemo);
      }
    }
  }, []);

  // メモの保存
  const saveMemo = () => {
    setMemo(editMemoText);
    localStorage.setItem('gantt-memo', editMemoText);
    setIsEditingMemo(false);
    setEditMemoText('');
  };

  // 表示期間の計算（1ヶ月表示）
  const displayRange = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return { start, end };
  }, [currentDate]);

  // 日の配列を生成
  const days = useMemo(() => {
    return eachDayOfInterval(displayRange);
  }, [displayRange]);

  // ラベルごとにタスクをグループ化（localStorageのデータを使用）
  const tasksByLabel = useMemo(() => {
    const grouped: { [key: string]: typeof tasks } = {};
    
    // デフォルトラベル（本業、副業、プライベート）を優先
    const defaultLabels = ['1', '2', '3']; // 本業、副業、プライベートのID
    
    defaultLabels.forEach(labelId => {
      grouped[labelId] = tasks.filter(task => task.label === labelId);
    });
    
    // その他のラベル
    labels.forEach(label => {
      if (!defaultLabels.includes(label.id)) {
        grouped[label.id] = tasks.filter(task => task.label === label.id);
      }
    });

    // ラベルが設定されていないタスクを「未分類」として表示
    const unlabeledTasks = tasks.filter(task => !task.label || task.label === '');
    if (unlabeledTasks.length > 0) {
      grouped['unlabeled'] = unlabeledTasks;
    }
    
    return grouped;
  }, [tasks, labels]);

  // タスクの位置と幅を計算（localStorageの日付データを使用）
  const getTaskPosition = (task: any) => {
    const startDate = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
    const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
    
    const totalDays = days.length;
    
    // 表示範囲内でのタスクの開始日と終了日を計算
    const displayStart = displayRange.start;
    const displayEnd = displayRange.end;
    
    // タスクの実際の開始日と終了日を表示範囲内に制限
    const taskStartInRange = startDate < displayStart ? displayStart : startDate;
    const taskEndInRange = dueDate > displayEnd ? displayEnd : dueDate;
    
    // 表示範囲内でのインデックスを計算
    const taskStartIndex = days.findIndex(day => isSameDay(day, taskStartInRange));
    const taskEndIndex = days.findIndex(day => isSameDay(day, taskEndInRange));
    
    // タスクが表示範囲と重複しない場合は非表示
    if (taskStartIndex === -1 || taskEndIndex === -1 || taskEndInRange < displayStart || taskStartInRange > displayEnd) {
      return { left: '0%', width: '0%', visible: false };
    }
    
    const left = Math.max(0, (taskStartIndex / totalDays) * 100);
    const width = Math.max(1, ((taskEndIndex - taskStartIndex + 1) / totalDays) * 100);
    
    return { left: `${left}%`, width: `${width}%`, visible: true };
  };

  // ナビゲーション
  const goToPrevious = () => {
    setCurrentDate(subWeeks(currentDate, 4));
  };

  const goToNext = () => {
    setCurrentDate(addWeeks(currentDate, 4));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 月切り替えナビゲーション
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // 現在の表示期間のラベル
  const getCurrentPeriodLabel = () => {
    return `${format(displayRange.start, 'yyyy年M月', { locale: ja })}`;
  };

  // データ読み込み中の表示
  if (!isDataLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <div className="flex justify-between items-center p-6 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">ガントチャート</h1>
          <p className="text-sm text-gray-600">
            タスクの進捗とスケジュールを視覚的に管理 - {getCurrentPeriodLabel()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            表示中のタスク: {tasks.length}件 / ラベル: {labels.length}件
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
            <Calendar size={16} />
            {format(currentDate, 'yyyy年M月', { locale: ja })}
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* ガントチャート本体 */}
      <div className="flex-1 overflow-auto">
        <div className="w-full max-w-none">
          {/* 時間軸ヘッダー */}
          <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
            <div className="flex">
              {/* 日付軸 */}
              <div className="flex-1 flex">
                {days.map((day, index) => {
                  const isSaturday = day.getDay() === 6;
                  const isSunday = day.getDay() === 0;
                  
                  return (
                    <div 
                      key={index} 
                      className={cn(
                        "flex-1 min-w-8 border-r border-gray-200 text-center flex-shrink-0",
                        isToday(day) && "bg-orange-50",
                        isSaturday && "bg-blue-50",
                        isSunday && "bg-red-50"
                      )}
                    >
                      <div className={cn(
                        "h-6 flex items-center justify-center text-xs",
                        isToday(day) && "text-gray-700",
                        isSaturday && "text-blue-700 font-medium",
                        isSunday && "text-red-700 font-medium",
                        !isToday(day) && !isSaturday && !isSunday && "text-gray-700"
                      )}>
                        {format(day, 'M/d', { locale: ja })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ガントチャート本体 */}
          <div className="bg-white">
            {/* デフォルトラベル行を常に表示 */}
            {['1', '2', '3'].map((labelId) => {
              const label = getLabelById(labelId);
              if (!label) return null;
              
              const labelTasks = tasksByLabel[labelId] || [];
              
              return (
                <div key={labelId} className="border-b border-gray-100">
                  {/* タスク行 */}
                  {labelTasks.map((task) => {
                    const position = getTaskPosition(task);
                    const isOverdue = task.dueDate < new Date() && task.status !== 'completed';
                    
                    // タスクが表示範囲と重複する場合のみ表示
                    if (!position.visible) return null;
                    
                    return (
                      <div key={task.id} className="flex h-8">
                        <div className="flex-1 relative min-w-0">
                          {/* グリッド線 */}
                          <div className="absolute inset-0 flex">
                            {days.map((_, index) => (
                              <div key={index} className="flex-1 border-r border-gray-100" />
                            ))}
                          </div>
                          
                          {/* ガントバー */}
                          <div
                            className={cn(
                              "absolute top-0 bottom-0 rounded-md flex items-center px-2 text-xs text-white font-medium cursor-pointer transition-all duration-200 hover:shadow-md",
                              isOverdue && "ring-2 ring-red-500"
                            )}
                            style={{
                              left: position.left,
                              width: position.width,
                              backgroundColor: label.color,
                              opacity: task.status === 'completed' ? 0.7 : 1
                            }}
                            title={`${task.title} (${task.progress}%)`}
                          >
                            <span className="truncate">{task.title}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            
            {/* 空の行を追加してページいっぱいに */}
            {Array.from({ length: 20 }, (_, index) => (
              <div key={`empty-${index}`} className="border-b border-gray-100">
                <div className="flex h-6">
                  <div className="flex-1 relative min-w-0">
                    {/* グリッド線 */}
                    <div className="absolute inset-0 flex">
                      {days.map((_, dayIndex) => (
                        <div key={dayIndex} className="flex-1 border-r border-gray-100" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* メモエリア（赤枠部分） */}
            <div className="h-64 bg-gray-50 border-t border-gray-200 p-4">
              <div className="h-full flex flex-col">
                <div className="flex-1">
                  {isEditingMemo ? (
                    <div className="h-full flex flex-col">
                      <textarea
                        value={editMemoText}
                        onChange={(e) => setEditMemoText(e.target.value)}
                        className="flex-1 w-full text-sm p-3 border border-blue-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="メモを入力..."
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={saveMemo}
                          className="text-xs"
                        >
                          <Save size={12} className="mr-1" />
                          保存
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditingMemo(false);
                            setEditMemoText('');
                          }}
                          className="text-xs"
                        >
                          <X size={12} className="mr-1" />
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="h-full bg-white border rounded p-3 overflow-y-auto cursor-pointer hover:border-gray-300 transition-colors"
                      onClick={() => {
                        setIsEditingMemo(true);
                        setEditMemoText(memo);
                      }}
                    >
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {memo || 'クリックしてメモを追加...'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
