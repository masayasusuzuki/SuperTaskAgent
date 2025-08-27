'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useTaskStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { googleCalendarClientService } from '@/lib/googleCalendarClient';

export default function Calendar() {
  const { 
    tasks, 
    labels, 
    getLabelById,
    googleAuthToken,
    googleCalendars,
    googleEvents,
    setGoogleEvents,
    setGoogleCalendars
  } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoadingGoogleEvents, setIsLoadingGoogleEvents] = useState(false);

  // 現在の月の日付範囲を計算
  const monthRange = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return { start, end };
  }, [currentDate]);

  // Googleカレンダーイベントを取得
  useEffect(() => {
    const fetchGoogleEvents = async () => {
      if (!googleAuthToken || googleCalendars.length === 0) {
        return;
      }

      setIsLoadingGoogleEvents(true);
      try {
        const timeMin = monthRange.start.toISOString();
        const timeMax = monthRange.end.toISOString();
        
        const calendarIds = googleCalendars.map(cal => cal.id);

        const eventsData = await googleCalendarClientService.getMultipleCalendarEvents(
          calendarIds,
          timeMin,
          timeMax,
          googleAuthToken
        );

        // すべてのイベントをフラット化
        const allEvents = eventsData.flatMap(({ events }) => events);
        setGoogleEvents(allEvents);
      } catch (error) {
        console.error('Error fetching Google events:', error);
      } finally {
        setIsLoadingGoogleEvents(false);
      }
    };

    fetchGoogleEvents();
  }, [googleAuthToken, googleCalendars, monthRange, setGoogleEvents]);

  // 月の日付配列を生成（前月・次月の日付も含む）
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    
    // カレンダーの開始日（前月の日付を含む）- 月曜日開始
    const calendarStart = new Date(start);
    const dayOfWeek = start.getDay(); // 0=日曜日, 1=月曜日, ..., 6=土曜日
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 月曜日開始に調整
    calendarStart.setDate(start.getDate() - daysToSubtract);
    
    // カレンダーの終了日（次月の日付を含む）- 月曜日開始
    const calendarEnd = new Date(end);
    const endDayOfWeek = end.getDay(); // 0=日曜日, 1=月曜日, ..., 6=土曜日
    const daysToAdd = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek; // 月曜日開始に調整
    calendarEnd.setDate(end.getDate() + daysToAdd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // 各日のタスクを取得
  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => {
      const taskStart = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
      const taskEnd = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
      
      return date >= taskStart && date <= taskEnd;
    });
  };

  // 各日のGoogleカレンダーイベントを取得
  const getGoogleEventsForDay = (date: Date) => {
    return googleEvents.filter(event => {
      const eventStart = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date!);
      const eventEnd = event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date!);
      
      return date >= eventStart && date <= eventEnd;
    });
  };

  // すべてのイベントを取得（タスク + Googleカレンダー）
  const getAllEventsForDay = (date: Date) => {
    const tasks = getTasksForDay(date);
    const googleEvents = getGoogleEventsForDay(date);
    
    return {
      tasks,
      googleEvents,
      total: tasks.length + googleEvents.length
    };
  };

  // ナビゲーション
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Googleカレンダー連携ページに移動
  const goToGoogleAuth = () => {
    window.location.href = '/auth';
  };

  // カレンダー選択を切り替え
  const toggleCalendarSelection = (calendarId: string) => {
    const updatedCalendars = googleCalendars.map(cal =>
      cal.id === calendarId ? { ...cal, selected: !cal.selected } : cal
    );
    setGoogleCalendars(updatedCalendars);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <div className="flex justify-between items-center p-6 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">カレンダー</h1>
          <p className="text-sm text-gray-600">
            スケジュールとタスクをカレンダー形式で管理
          </p>
          {googleAuthToken && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Googleカレンダーと連携済み
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!googleAuthToken && (
            <Button variant="outline" size="sm" onClick={goToGoogleAuth}>
              <ExternalLink size={16} className="mr-2" />
              Google連携
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            <CalendarIcon size={16} />
            {format(currentDate, 'yyyy年M月', { locale: ja })}
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* カレンダー本体 */}
      <div className="flex-1 overflow-auto p-6">



        <div className="h-full bg-white rounded-lg shadow-sm border flex flex-col">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 border-b border-gray-200 flex-shrink-0">
            {['月', '火', '水', '木', '金', '土', '日'].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* カレンダーグリッド */}
          <div className="grid grid-cols-7 flex-1">
            {calendarDays.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              const isSaturday = day.getDay() === 6;
              const isSunday = day.getDay() === 0;
              const dayEvents = getAllEventsForDay(day);
              
              return (
                <div
                  key={index}
                  className={cn(
                    "border-r border-b border-gray-100 p-2 flex flex-col",
                    !isCurrentMonth && "bg-gray-50",
                    isTodayDate && "bg-orange-50",
                    isSaturday && isCurrentMonth && "bg-blue-50",
                    isSunday && isCurrentMonth && "bg-red-50"
                  )}
                >
                  {/* 日付 */}
                  <div className={cn(
                    "text-sm font-medium mb-1 flex-shrink-0",
                    isCurrentMonth ? "text-gray-900" : "text-gray-400",
                    isTodayDate && "text-orange-600",
                    isSaturday && isCurrentMonth && "text-blue-700",
                    isSunday && isCurrentMonth && "text-red-700"
                  )}>
                    {format(day, 'd')}
                  </div>

                  {/* イベント */}
                  <div className="space-y-1 flex-1 overflow-y-auto">
                    {/* タスク */}
                    {dayEvents.tasks.slice(0, 2).map((task) => {
                      const label = getLabelById(task.label);
                      return (
                        <div
                          key={`task-${task.id}`}
                          className="text-xs p-1 rounded truncate flex-shrink-0 border-l-2 border-blue-500"
                          style={{
                            backgroundColor: label?.color || '#6b7280',
                            color: 'white'
                          }}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      );
                    })}

                    {/* Googleカレンダーイベント */}
                    {dayEvents.googleEvents.slice(0, 2).map((event) => {
                      // 自分が主催者かどうかを判定
                      const isOrganizer = event.organizer?.self === true;
                      // 自分が参加者かどうかを判定
                      const isAttendee = event.attendees?.some((attendee: any) => attendee.self === true);
                      
                      let eventType = 'other';
                      if (isOrganizer) {
                        eventType = 'organizer';
                      } else if (isAttendee) {
                        eventType = 'attendee';
                      }
                      
                      const getEventStyle = () => {
                        switch (eventType) {
                          case 'organizer':
                            return 'border-l-2 border-green-500 bg-green-100 text-green-800';
                          case 'attendee':
                            return 'border-l-2 border-purple-500 bg-purple-100 text-purple-800';
                          default:
                            return 'border-l-2 border-gray-500 bg-gray-100 text-gray-800';
                        }
                      };
                      
                      const getEventTitle = () => {
                        let title = event.summary;
                        if (isOrganizer) {
                          title += ' (主催)';
                        } else if (isAttendee) {
                          title += ' (参加)';
                        }
                        return title;
                      };
                      
                      return (
                        <div
                          key={`google-${event.id}`}
                          className={`text-xs p-1 rounded truncate flex-shrink-0 ${getEventStyle()}`}
                          title={getEventTitle()}
                        >
                          {event.summary}
                        </div>
                      );
                    })}

                    {/* イベント数表示 */}
                    {dayEvents.total > 4 && (
                      <div className="text-xs text-gray-500 flex-shrink-0">
                        +{dayEvents.total - 4}件
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
