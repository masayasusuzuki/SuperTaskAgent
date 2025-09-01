'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ExternalLink, Clock, MapPin } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, isSameDay as dateFnsIsSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useTaskStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { googleCalendarClientService } from '@/lib/googleCalendarClient';
import CalendarEventModal from './CalendarEventModal';

// 今日の予定コンポーネント
const TodaysSchedule: React.FC = () => {
  const { tasks, googleEvents, getLabelById } = useTaskStore();
  const today = new Date();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 今日のタスクを取得（カレンダーではタスクを表示しない）
  const todaysTasks: any[] = [];

  // 今日のGoogleカレンダーイベントを取得
  const todaysGoogleEvents = googleEvents.filter(event => {
    if (event.start.date && !event.start.dateTime) {
      const eventDate = new Date(event.start.date);
      return dateFnsIsSameDay(today, eventDate);
    }
    
    if (event.start.dateTime) {
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.start.dateTime);
      
      const dayStart = new Date(today);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(today);
      dayEnd.setHours(23, 59, 59, 999);
      
      return eventStart <= dayEnd && eventEnd >= dayStart;
    }
    
    return false;
  });

  // 時間順にソート
  const sortedEvents = [...todaysGoogleEvents].sort((a, b) => {
    const aTime = a.start.dateTime ? new Date(a.start.dateTime).getTime() : 0;
    const bTime = b.start.dateTime ? new Date(b.start.dateTime).getTime() : 0;
    return aTime - bTime;
  });

  const formatTime = (dateTime: string) => {
    return format(new Date(dateTime), 'HH:mm', { locale: ja });
  };

  const getEventTimeDisplay = (event: any) => {
    if (event.start.dateTime) {
      const startTime = formatTime(event.start.dateTime);
      if (event.end.dateTime) {
        const endTime = formatTime(event.end.dateTime);
        return `${startTime}-${endTime}`;
      }
      return startTime;
    }
    return '終日';
  };

  const getEventStyle = (event: any) => {
    const isOrganizer = event.organizer?.self === true;
    const isAttendee = event.attendees?.some((attendee: any) => attendee.self === true);
    
    if (isOrganizer) {
      return 'border-l-4 border-green-500 bg-green-50';
    } else if (isAttendee) {
      return 'border-l-4 border-purple-500 bg-purple-50';
    }
    return 'border-l-4 border-gray-500 bg-gray-50';
  };

  const getEventTitle = (event: any) => {
    let title = event.summary;
    const isOrganizer = event.organizer?.self === true;
    const isAttendee = event.attendees?.some((attendee: any) => attendee.self === true);
    
    if (isOrganizer) {
      title += ' (主催)';
    } else if (isAttendee) {
      title += ' (参加)';
    }
    return title;
  };

  const totalEvents = sortedEvents.length;

  if (totalEvents === 0) {
    return (
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
              <CalendarIcon size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">今日の予定</h3>
              <p className="text-sm text-gray-600">予定はありません</p>
            </div>
          </div>
          <div className="text-sm text-blue-600 font-medium bg-white px-3 py-1 rounded-full shadow-sm">
            {format(today, 'M月d日 (E)', { locale: ja })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
            <CalendarIcon size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">今日の予定</h3>
            <p className="text-sm text-gray-600">{totalEvents}件の予定</p>
          </div>
        </div>
        <div className="text-sm text-blue-600 font-medium bg-white px-3 py-1 rounded-full shadow-sm">
          {format(today, 'M月d日 (E)', { locale: ja })}
        </div>
      </div>
      
      <div className="space-y-3">
        {/* Googleカレンダーイベント */}
        {sortedEvents.map((event) => (
          <div 
            key={`google-${event.id}`} 
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group",
              getEventStyle(event)
            )}
            onClick={() => setIsModalOpen(true)}
          >
            <div className="flex items-center gap-2 flex-shrink-0">
              <Clock size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors" />
              <span className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                {getEventTimeDisplay(event)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {getEventTitle(event)}
              </div>
              {(event as any).location && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <MapPin size={10} />
                  <span className="truncate">{(event as any).location}</span>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0">
              →
            </div>
          </div>
        ))}
      </div>

      {/* 詳細モーダル */}
      <CalendarEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={today}
        events={{ tasks: [], googleEvents: sortedEvents }}
        getLabelById={getLabelById}
      />
    </div>
  );
};

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
        
        const calendarIds = googleCalendars
          .filter(cal => cal.selected)
          .map(cal => cal.id);

        const eventsData = await googleCalendarClientService.getMultipleCalendarEvents(
          calendarIds,
          timeMin,
          timeMax,
          googleAuthToken
        );

        // すべてのイベントをフラット化
        const allEvents = eventsData.flatMap(({ events }) => events);
        setGoogleEvents(allEvents);
        
        // デバッグ情報をコンソールに出力
        console.log('Google Calendar Events:', allEvents);
        allEvents.forEach((event, index) => {
          console.log(`Event ${index + 1}:`, {
            summary: event.summary,
            start: event.start,
            end: event.end,
            hasDateTime: !!event.start.dateTime,
            hasDate: !!event.start.date
          });
        });
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
      // 日付のみのイベントの場合
      if (event.start.date && !event.start.dateTime) {
        const eventDate = new Date(event.start.date);
        const isMatch = isSameDay(date, eventDate);
        if (isMatch) {
          console.log(`Date-only event matched for ${format(date, 'yyyy-MM-dd')}:`, event.summary);
        }
        return isMatch;
      }
      
      // 時間付きイベントの場合
      if (event.start.dateTime) {
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.start.dateTime);
        
        // 指定日の開始時刻と終了時刻
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        
        // イベントが指定日と重複するかチェック
        const isMatch = eventStart <= dayEnd && eventEnd >= dayStart;
        if (isMatch) {
          console.log(`Time-based event matched for ${format(date, 'yyyy-MM-dd')}:`, {
            summary: event.summary,
            start: eventStart,
            end: eventEnd,
            dayStart,
            dayEnd
          });
        }
        return isMatch;
      }
      
      return false;
    });
  };

  // すべてのイベントを取得（Googleカレンダーのみ）
  const getAllEventsForDay = (date: Date) => {
    const googleEvents = getGoogleEventsForDay(date);
    
    return {
      tasks: [], // todoタスクは表示しない
      googleEvents,
      total: googleEvents.length
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

  // 日付クリックハンドラー
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
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
    <div className="flex-1 flex flex-col">
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
          <Button variant="outline" size="sm" onClick={goToGoogleAuth}>
            <ExternalLink size={16} className="mr-2" />
            {googleAuthToken ? 'Google連携設定' : 'Google連携'}
          </Button>
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

      {/* 今日の予定 */}
      <TodaysSchedule />

      {/* Googleカレンダー選択（連携済みの場合のみ表示） */}
      {googleAuthToken && googleCalendars.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">表示するカレンダー:</span>
            <div className="flex gap-2 flex-wrap">
              {googleCalendars.map((calendar) => (
                <label key={calendar.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={calendar.selected}
                    onChange={() => toggleCalendarSelection(calendar.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{calendar.summary}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* カレンダー本体 */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 border-b border-gray-200 flex-shrink-0">
            {['月', '火', '水', '木', '金', '土', '日'].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* カレンダーグリッド */}
          <div className="grid grid-cols-7">
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
                  <div 
                    className={cn(
                      "text-sm font-medium mb-1 flex-shrink-0 cursor-pointer hover:bg-gray-100 rounded px-1 py-1 transition-colors",
                      isCurrentMonth ? "text-gray-900" : "text-gray-400",
                      isTodayDate && "text-orange-600",
                      isSaturday && isCurrentMonth && "text-blue-700",
                      isSunday && isCurrentMonth && "text-red-700"
                    )}
                    onClick={() => handleDateClick(day)}
                  >
                    {format(day, 'd')}
                  </div>

                  {/* イベント */}
                  <div className="space-y-1 min-h-[80px]">
                    {/* Googleカレンダーイベント */}
                    {dayEvents.googleEvents.slice(0, 3).map((event) => {
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

                      const formatTime = (dateTime: string) => {
                        return format(new Date(dateTime), 'HH:mm', { locale: ja });
                      };

                      const getTimeDisplay = () => {
                        if (event.start.dateTime) {
                          const startTime = formatTime(event.start.dateTime);
                          if (event.end.dateTime) {
                            const endTime = formatTime(event.end.dateTime);
                            return `${startTime}-${endTime}`;
                          }
                          return startTime;
                        }
                        return '';
                      };
                      
                      return (
                        <div
                          key={`google-${event.id}`}
                          className={`text-xs p-1 rounded truncate flex-shrink-0 ${getEventStyle()}`}
                          title={getEventTitle()}
                        >
                          <div className="flex items-center space-x-1">
                            {event.start.dateTime && (
                              <span className="text-xs opacity-75 font-mono">
                                {getTimeDisplay()}
                              </span>
                            )}
                            <span className="truncate">{event.summary}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* イベント数表示 */}
                    {dayEvents.total > 3 && (
                      <div className="text-xs text-gray-500 flex-shrink-0">
                        +{dayEvents.total - 3}件
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* イベント詳細モーダル */}
      <CalendarEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        events={selectedDate ? getAllEventsForDay(selectedDate) : { tasks: [], googleEvents: [] }}
        getLabelById={getLabelById}
      />
    </div>
  );
}
