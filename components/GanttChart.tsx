'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Edit3, Save, X } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays, addWeeks, subWeeks, isToday, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useTaskStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function GanttChart() {
  const { tasks, labels, getLabelById, googleEvents } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date()); // 現在の日付を初期値に設定
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
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999); // 月の最後の日の23:59:59
    
    console.log('Display range calculation:', {
      currentDate: currentDate.toISOString(),
      start: start.toISOString(),
      end: end.toISOString(),
      startDay: start.getDate(),
      endDay: end.getDate(),
      year,
      month
    });
    
    return { start, end };
  }, [currentDate]);

  // 日の配列を生成
  const days = useMemo(() => {
    const daysArray = eachDayOfInterval(displayRange);
    console.log('Days array generated:', {
      length: daysArray.length,
      firstDay: daysArray[0]?.toISOString(),
      lastDay: daysArray[daysArray.length - 1]?.toISOString(),
      sampleDays: daysArray.slice(0, 5).map(day => day.toISOString())
    });
    return daysArray;
  }, [displayRange]);

  // ラベルごとにタスクをグループ化（localStorageのデータを使用）
  const tasksByLabel = useMemo(() => {
    const grouped: { [key: string]: typeof tasks } = {};
    
    // シンプルなタスクフィルタリング
    const validTasks = tasks.filter(task => 
      task && 
      task.id && 
      task.title && 
      task.startDate &&
      task.dueDate
    );
    
    console.log('=== GANTT CHART TASK ANALYSIS ===');
    console.log('Total tasks:', tasks.length);
    console.log('Valid tasks:', validTasks.length);
    console.log('Valid tasks details:', validTasks.map(t => ({ 
      id: t.id, 
      title: t.title, 
      label: t.label, 
      startDate: t.startDate, 
      dueDate: t.dueDate
    })));
    
    // デフォルトラベル（本業、副業、プライベート）を優先
    const defaultLabels = ['1', '2', '3']; // 本業、副業、プライベートのID
    
    defaultLabels.forEach(labelId => {
      grouped[labelId] = validTasks.filter(task => task.label === labelId);
      console.log(`Tasks for label ${labelId}:`, grouped[labelId].map(t => t.title));
    });
    
    // その他のラベル
    labels.forEach(label => {
      if (!defaultLabels.includes(label.id)) {
        grouped[label.id] = validTasks.filter(task => task.label === label.id);
        console.log(`Tasks for label ${label.id}:`, grouped[label.id].map(t => t.title));
      }
    });

    // ラベルが設定されていないタスクを「未分類」として表示
    const unlabeledTasks = validTasks.filter(task => !task.label || task.label === '');
    if (unlabeledTasks.length > 0) {
      grouped['unlabeled'] = unlabeledTasks;
      console.log('Unlabeled tasks:', unlabeledTasks.map(t => t.title));
    }
    
    console.log('Final grouped tasks:', grouped);
    return grouped;
  }, [tasks, labels]);

  // タスクの位置と幅を計算（localStorageの日付データを使用）
  const getTaskPosition = (task: any) => {
    // 日付データの詳細デバッグ
    console.log(`=== Task Position Calculation for: ${task.title} ===`);
    console.log('Raw task data:', {
      id: task.id,
      title: task.title,
      startDate: task.startDate,
      dueDate: task.dueDate,
      startDateType: typeof task.startDate,
      dueDateType: typeof task.dueDate,
      startDateIsDate: task.startDate instanceof Date,
      dueDateIsDate: task.dueDate instanceof Date
    });
    
    // 日付を正しく解析（時間部分を無視して日付のみで比較）
    const parseDate = (dateInput: any) => {
      if (dateInput instanceof Date) {
        return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
      }
      // 文字列の場合は、ISO形式またはその他の形式を処理
      const date = new Date(dateInput);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };
    
    const startDate = parseDate(task.startDate);
    const dueDate = parseDate(task.dueDate);
    
    console.log('Parsed dates:', {
      startDate: startDate.toISOString(),
      dueDate: dueDate.toISOString(),
      startDateValid: !isNaN(startDate.getTime()),
      dueDateValid: !isNaN(dueDate.getTime())
    });
    
    const totalDays = days.length;
    const displayStart = displayRange.start;
    const displayEnd = displayRange.end;
    
    console.log('Display range:', {
      displayStart: displayStart.toISOString(),
      displayEnd: displayEnd.toISOString(),
      totalDays
    });
    
    // タスクが表示範囲と重複するかチェック（日付のみで比較）
    const displayStartDate = new Date(displayStart.getFullYear(), displayStart.getMonth(), displayStart.getDate());
    const displayEndDate = new Date(displayEnd.getFullYear(), displayEnd.getMonth(), displayEnd.getDate());
    
    // より柔軟な範囲チェック：前後1ヶ月のタスクも表示
    const extendedStartDate = new Date(displayStartDate);
    extendedStartDate.setMonth(extendedStartDate.getMonth() - 1);
    const extendedEndDate = new Date(displayEndDate);
    extendedEndDate.setMonth(extendedEndDate.getMonth() + 1);
    
    const isOutsideRange = dueDate < extendedStartDate || startDate > extendedEndDate;
    console.log('Range check:', {
      dueDateBeforeStart: dueDate < extendedStartDate,
      startDateAfterEnd: startDate > extendedEndDate,
      isOutsideRange,
      startDate: startDate.toISOString(),
      dueDate: dueDate.toISOString(),
      displayStartDate: displayStartDate.toISOString(),
      displayEndDate: displayEndDate.toISOString(),
      extendedStartDate: extendedStartDate.toISOString(),
      extendedEndDate: extendedEndDate.toISOString()
    });
    
    if (isOutsideRange) {
      console.log('Task is outside display range - hiding');
      return { left: '0%', width: '0%', visible: false };
    }
    
    // 表示範囲内でのタスクの開始日と終了日を計算
    const taskStartInRange = startDate < displayStartDate ? displayStartDate : startDate;
    const taskEndInRange = dueDate > displayEndDate ? displayEndDate : dueDate;
    
    // タスクが拡張範囲内にある場合のみ表示
    if (taskStartInRange > extendedEndDate || taskEndInRange < extendedStartDate) {
      console.log('Task is outside extended range - hiding');
      return { left: '0%', width: '0%', visible: false };
    }
    
    console.log('Task range in display:', {
      taskStartInRange: taskStartInRange.toISOString(),
      taskEndInRange: taskEndInRange.toISOString()
    });
    
    // 表示範囲内でのインデックスを計算（日付のみで比較）
    const taskStartIndex = days.findIndex(day => {
      const dayDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      return dayDate.getTime() === taskStartInRange.getTime();
    });
    
    const taskEndIndex = days.findIndex(day => {
      const dayDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      return dayDate.getTime() === taskEndInRange.getTime();
    });
    
    console.log('Day indices:', {
      taskStartIndex,
      taskEndIndex,
      daysLength: days.length,
      firstDay: days[0]?.toISOString(),
      lastDay: days[days.length - 1]?.toISOString()
    });
    
    // 詳細な日付比較デバッグ
    console.log('Detailed date comparison:', {
      taskStartInRange: taskStartInRange.toISOString(),
      taskEndInRange: taskEndInRange.toISOString(),
      daysSample: days.slice(0, 5).map(day => day.toISOString()),
      daysSampleEnd: days.slice(-5).map(day => day.toISOString())
    });
    
    // タスクが表示範囲と重複しない場合は非表示
    if (taskStartIndex === -1 || taskEndIndex === -1) {
      console.log('Task indices are invalid - hiding');
      return { left: '0%', width: '0%', visible: false };
    }
    
    const left = Math.max(0, (taskStartIndex / totalDays) * 100);
    const width = Math.max(1, ((taskEndIndex - taskStartIndex + 1) / totalDays) * 100);
    
    console.log('Final position:', {
      left: `${left}%`,
      width: `${width}%`,
      visible: true
    });
    
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
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* ヘッダー */}
      <div className="flex justify-between items-center p-6 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">ガントチャート</h1>
          <p className="text-sm text-gray-600">
            タスクの進捗とスケジュールを視覚的に管理 - {getCurrentPeriodLabel()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            表示中のタスク: {tasks.length}件 / ラベル: {labels.length}件
            <span className="text-green-600 ml-2">✓ 完了タスクは緑色で表示</span>
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
      <div className="flex-1 overflow-auto min-w-0">
        <div className="w-full max-w-none min-w-0">
          {/* 時間軸ヘッダー */}
          <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
            <div className="flex">
              {/* タスク名ヘッダー */}
              <div className="w-48 bg-gray-50 border-r border-gray-200 px-3 flex items-center">
                <span className="text-sm font-medium text-gray-700">タスク名</span>
              </div>
              
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
                        "h-10 flex flex-col items-center justify-center text-xs leading-tight",
                        isToday(day) && "text-gray-700",
                        isSaturday && "text-blue-700 font-medium",
                        isSunday && "text-red-700 font-medium",
                        !isToday(day) && !isSaturday && !isSunday && "text-gray-700"
                      )}>
                        <div>{format(day, 'M/d', { locale: ja })}</div>
                        <div className="text-xs">{format(day, 'E', { locale: ja })}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ガントチャート本体 */}
          <div className="bg-white">
            {/* すべてのタスクを個別の行に表示 */}
            {tasks.filter(task => 
              task && 
              task.id && 
              task.title && 
              task.startDate &&
              task.dueDate
            ).map((task, index) => {
              const position = getTaskPosition(task);
              const isOverdue = task.dueDate < new Date() && task.status !== 'completed';
              const label = getLabelById(task.label);
              
              // デバッグ情報を出力
              console.log(`Rendering task: ${task.title}`, {
                label: task.label,
                position,
                isVisible: position.visible,
                startDate: task.startDate,
                dueDate: task.dueDate,
                currentMonth: currentDate.getMonth(),
                taskStartMonth: new Date(task.startDate).getMonth(),
                taskDueMonth: new Date(task.dueDate).getMonth()
              });
              
              // タスクが表示範囲と重複する場合のみ表示
              if (!position.visible) {
                console.log(`Task ${task.title} is not visible - skipping`);
                return null;
              }
              
              return (
                <div key={task.id} className={cn(
                  "border-b border-gray-100",
                  task.status === 'completed' && "bg-green-50"
                )}>
                  {/* タスク行（固定高さ） */}
                  <div className="flex h-8">
                    {/* タスク名とラベル表示 */}
                    <div className={cn(
                      "w-48 border-r border-gray-200 px-3 flex items-center justify-between",
                      task.status === 'completed' ? "bg-green-100" : "bg-gray-50"
                    )}>
                      <div className="flex items-center gap-2 min-w-0">
                        {label && (
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: label.color }}
                          />
                        )}
                        <span className={cn(
                          "text-sm font-medium truncate",
                          task.status === 'completed' ? "text-green-800" : "text-gray-900"
                        )} title={task.title}>
                          {task.title}
                          {task.status === 'completed' && (
                            <span className="text-xs text-green-600 ml-1">✓</span>
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex-shrink-0">
                        {task.progress}%
                      </div>
                    </div>
                    
                    {/* ガントチャート部分 */}
                    <div className="flex-1 relative min-w-0">
                      {/* グリッド線 */}
                      <div className="absolute inset-0 flex">
                        {days.map((_, dayIndex) => (
                          <div key={dayIndex} className="flex-1 border-r border-gray-100" />
                        ))}
                      </div>
                      
                      {/* タスクバー */}
                      <div
                        className={cn(
                          "absolute top-1 bottom-1 rounded-md flex items-center px-2 text-xs text-white font-medium cursor-pointer transition-all duration-200 hover:shadow-md",
                          isOverdue && "ring-2 ring-red-500"
                        )}
                        style={{
                          left: position.left,
                          width: position.width,
                          backgroundColor: label?.color || '#6B7280',
                          opacity: task.status === 'completed' ? 0.7 : 1
                        }}
                        title={`${task.title} (${task.progress}%)`}
                      >
                        <span className="truncate">{task.title}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* 空の行を追加してページいっぱいに */}
            {Array.from({ length: 20 }, (_, index) => (
              <div key={`empty-${index}`} className="border-b border-gray-100">
                <div className="flex h-6">
                  {/* タスク名列の空セル */}
                  <div className="w-48 bg-gray-50 border-r border-gray-200"></div>
                  
                  {/* ガントチャート部分の空セル */}
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
