'use client';

import React from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { X, Clock, Calendar, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task, Label } from '@/types';
import { GoogleCalendarEvent } from '@/lib/googleCalendar';

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  events: {
    tasks: Task[];
    googleEvents: GoogleCalendarEvent[];
  };
  getLabelById: (id: string) => Label | undefined;
}

export default function CalendarEventModal({
  isOpen,
  onClose,
  selectedDate,
  events,
  getLabelById
}: CalendarEventModalProps) {
  if (!isOpen || !selectedDate) return null;

  const formatTime = (dateTime: string) => {
    return format(new Date(dateTime), 'HH:mm', { locale: ja });
  };

  const formatDate = (date: Date) => {
    return format(date, 'yyyy年M月d日 (E)', { locale: ja });
  };

  // HTMLエンティティとタグを処理して改行を適切に表示
  const processDescription = (description: string) => {
    return description
      // HTMLエンティティをデコード
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      // 改行タグを改行文字に変換
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/div>/gi, '\n')
      // その他のHTMLタグを削除
      .replace(/<[^>]*>/g, '')
      // 連続する改行を整理
      .replace(/\n\s*\n/g, '\n\n')
      // 前後の空白を削除
      .trim();
  };

  // URLを検出してリンクとして表示するコンポーネント
  const LinkifiedText = ({ text }: { text: string }) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return (
      <>
        {parts.map((part, index) => {
          if (part.match(urlRegex)) {
            return (
              <a
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline break-all"
                onClick={(e) => e.stopPropagation()}
              >
                {part}
              </a>
            );
          }
          return part;
        })}
      </>
    );
  };

  const getEventTypeLabel = (event: GoogleCalendarEvent) => {
    if (event.organizer?.self) return '主催';
    if (event.attendees?.some(attendee => attendee.self)) return '参加';
    return 'その他';
  };

  const getEventTypeColor = (event: GoogleCalendarEvent) => {
    if (event.organizer?.self) return 'bg-green-100 text-green-800 border-green-200';
    if (event.attendees?.some(attendee => attendee.self)) return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const totalEvents = events.tasks.length + events.googleEvents.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {formatDate(selectedDate)}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {totalEvents}件のイベント
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X size={20} />
          </Button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {totalEvents === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">この日にはイベントがありません</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* タスク */}
              {events.tasks.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    タスク ({events.tasks.length}件)
                  </h3>
                  <div className="space-y-4">
                    {events.tasks.map((task) => {
                      const label = getLabelById(task.label);
                      return (
                        <div
                          key={task.id}
                          className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                          style={{
                            borderLeftColor: label?.color || '#6b7280',
                            borderLeftWidth: '4px'
                          }}
                        >
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-gray-900 text-base mb-1">
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                  <LinkifiedText text={processDescription(task.description)} />
                                </p>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <div className="flex items-center text-gray-500">
                                <Calendar size={14} className="mr-1" />
                                <span>
                                  {format(task.startDate, 'M/d')} - {format(task.dueDate, 'M/d')}
                                </span>
                              </div>
                              
                              {label && (
                                <span
                                  className="px-2 py-1 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: label.color,
                                    color: 'white'
                                  }}
                                >
                                  {label.name}
                                </span>
                              )}
                              
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                task.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {task.status === 'completed' ? '完了' :
                                 task.status === 'in-progress' ? '進行中' :
                                 task.status === 'on-hold' ? '保留' : '未開始'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Googleカレンダーイベント */}
              {events.googleEvents.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Googleカレンダー ({events.googleEvents.length}件)
                  </h3>
                  <div className="space-y-4">
                    {events.googleEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-4 border rounded-lg hover:shadow-sm transition-shadow ${getEventTypeColor(event)}`}
                      >
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-base">
                                {event.summary}
                              </h4>
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${getEventTypeColor(event)}`}>
                                {getEventTypeLabel(event)}
                              </span>
                            </div>
                            
                            {event.description && (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap opacity-90">
                                <LinkifiedText text={processDescription(event.description)} />
                              </p>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center text-gray-600">
                              <Clock size={14} className="mr-1" />
                              <span>
                                {event.start.dateTime ? (
                                  <>
                                    {formatTime(event.start.dateTime)}
                                    {event.end.dateTime && (
                                      <> - {formatTime(event.end.dateTime)}</>
                                    )}
                                  </>
                                ) : (
                                  '終日'
                                )}
                              </span>
                            </div>
                            
                            {event.organizer && (
                              <div className="flex items-center text-gray-600">
                                <User size={14} className="mr-1" />
                                <span className="truncate max-w-32">
                                  {event.organizer.displayName || event.organizer.email}
                                </span>
                              </div>
                            )}
                            
                            {event.attendees && event.attendees.length > 0 && (
                              <div className="flex items-center text-gray-600">
                                <Users size={14} className="mr-1" />
                                <span>{event.attendees.length}人</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
