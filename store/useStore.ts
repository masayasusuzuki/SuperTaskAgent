import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, Label, TaskFilter, SortOption } from '@/types';
import { GoogleCalendar, GoogleCalendarEvent } from '@/lib/googleCalendar';
import { storage } from '@/lib/storage';

// デバッグ情報の型定義
export interface DebugInfo {
  id: string;
  timestamp: Date;
  type: 'google_calendar' | 'gantt_chart' | 'todo' | 'general';
  title: string;
  data: any;
  status: 'success' | 'error' | 'info' | 'warning';
}

interface TaskStore {
  // State
  tasks: Task[];
  labels: Label[];
  currentView: 'todo' | 'gantt' | 'calendar' | 'stats' | 'settings' | 'debug' | 'completed';
  selectedLabel: string | null;
  filters: TaskFilter;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  
  // Google Calendar State
  googleAuthToken: string | null;
  googleRefreshToken: string | null;
  googleTokenExpiry: number | null;
  googleCalendars: GoogleCalendar[];
  googleEvents: GoogleCalendarEvent[];

  // Debug State
  debugHistory: DebugInfo[];
  maxDebugHistory: number;

  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  
  setLabels: (labels: Label[]) => void;
  addLabel: (label: Label) => void;
  updateLabel: (label: Label) => void;
  deleteLabel: (labelId: string) => void;
  
  setCurrentView: (view: 'todo' | 'gantt' | 'calendar' | 'stats' | 'settings' | 'debug' | 'completed') => void;
  setSelectedLabel: (labelId: string | null) => void;
  setFilters: (filters: TaskFilter) => void;
  setSortBy: (sortBy: SortOption) => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  
  // Google Calendar Actions
  setGoogleAuthToken: (token: string | null) => void;
  setGoogleRefreshToken: (token: string | null) => void;
  setGoogleTokenExpiry: (expiry: number | null) => void;
  setGoogleCalendars: (calendars: GoogleCalendar[]) => void;
  setGoogleEvents: (events: GoogleCalendarEvent[]) => void;
  toggleGoogleCalendar: (calendarId: string) => void;
  refreshGoogleToken: () => Promise<boolean>;
  clearGoogleAuth: () => void;
  
  // Debug Actions
  addDebugInfo: (info: Omit<DebugInfo, 'id' | 'timestamp'>) => void;
  clearDebugHistory: () => void;
  setMaxDebugHistory: (max: number) => void;
  
  // Computed
  getFilteredTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getCompletedTasksByDate: () => { [key: string]: Task[] };
  getLabelById: (id: string) => Label | undefined;
}

// デフォルトラベル
const getDefaultLabels = (): Label[] => [
  {
    id: '1',
    name: '本業',
    color: '#2563eb',
    createdAt: new Date()
  },
  {
    id: '2',
    name: '副業',
    color: '#059669',
    createdAt: new Date()
  },
  {
    id: '3',
    name: 'プライベート',
    color: '#dc2626',
    createdAt: new Date()
  }
];

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      // Initial state
      tasks: [],
      labels: getDefaultLabels(),
      currentView: 'todo',
      selectedLabel: null,
      filters: {},
      sortBy: 'dueDate',
      sortOrder: 'asc',

      // Google Calendar State
      googleAuthToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
      googleCalendars: [],
      googleEvents: [],

      // Debug State
      debugHistory: [],
      maxDebugHistory: 100,

      // Actions
      setTasks: (tasks) => set({ tasks }),
      addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
      updateTask: (task) => set((state) => ({
        tasks: state.tasks.map(t => t.id === task.id ? task : t)
      })),
      deleteTask: (taskId) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== taskId)
      })),

      setLabels: (labels) => set({ labels }),
      addLabel: (label) => set((state) => ({ labels: [...state.labels, label] })),
      updateLabel: (label) => set((state) => ({
        labels: state.labels.map(l => l.id === label.id ? label : l)
      })),
      deleteLabel: (labelId) => set((state) => ({
        labels: state.labels.filter(l => l.id !== labelId),
        tasks: state.tasks.map(task => 
          task.label === labelId ? { ...task, label: '' } : task
        )
      })),

      setCurrentView: (currentView) => set({ currentView }),
      setSelectedLabel: (selectedLabel) => set({ selectedLabel }),
      setFilters: (filters) => set({ filters }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (sortOrder) => set({ sortOrder }),

      // Google Calendar Actions
      setGoogleAuthToken: (token) => set({ googleAuthToken: token }),
      setGoogleCalendars: (calendars) => set({ googleCalendars: calendars }),
      setGoogleEvents: (events) => set({ googleEvents: events }),
      toggleGoogleCalendar: (calendarId) => set((state) => ({
        googleCalendars: state.googleCalendars.map(calendar =>
          calendar.id === calendarId ? { ...calendar, isSelected: !calendar.isSelected } : calendar
        )
      })),

      // Debug Actions
      addDebugInfo: (info) => set((state) => {
        const newDebugInfo = { ...info, id: Date.now().toString(), timestamp: new Date() };
        const updatedHistory = [...state.debugHistory, newDebugInfo];
        
        // 最大履歴数を超えた場合は古いものから削除
        if (updatedHistory.length > state.maxDebugHistory) {
          updatedHistory.splice(0, updatedHistory.length - state.maxDebugHistory);
        }
        
        return { debugHistory: updatedHistory };
      }),
      clearDebugHistory: () => set({ debugHistory: [] }),
      setMaxDebugHistory: (max) => set({ maxDebugHistory: max }),

      // Computed
      getFilteredTasks: () => {
        const { tasks, filters, selectedLabel } = get();
        let filtered = tasks;

        // 完了タスクを除外（完了ページで管理するため）
        filtered = filtered.filter(task => task.status !== 'completed');

        // Label filter
        if (selectedLabel) {
          filtered = filtered.filter(task => task.label === selectedLabel);
        }

        // Status filter
        if (filters.status) {
          filtered = filtered.filter(task => task.status === filters.status);
        }

        // Priority filter
        if (filters.priority) {
          filtered = filtered.filter(task => task.priority === filters.priority);
        }

        // Search filter
        if (filters.search) {
          filtered = filtered.filter(task => 
            task.title.toLowerCase().includes(filters.search!.toLowerCase()) ||
            task.description.toLowerCase().includes(filters.search!.toLowerCase())
          );
        }

        return filtered;
      },

      // 完了タスクを取得
      getCompletedTasks: () => {
        const { tasks } = get();
        return tasks.filter(task => 
          task.status === 'completed' && 
          task.completedAt && 
          (task.completedAt instanceof Date || typeof task.completedAt === 'string')
        );
      },

      // 完了タスクを日付別にグループ化
      getCompletedTasksByDate: () => {
        const completedTasks = get().getCompletedTasks();
        const grouped: { [key: string]: Task[] } = {};

        completedTasks.forEach(task => {
          // completedAtが文字列の場合はDateオブジェクトに変換
          const completedAt = task.completedAt instanceof Date 
            ? task.completedAt 
            : new Date(task.completedAt!);
          
          const dateKey = completedAt.toISOString().split('T')[0]; // YYYY-MM-DD形式
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          grouped[dateKey].push(task);
        });

        // 日付順にソート（新しい日付が上）
        return Object.entries(grouped)
          .sort(([a], [b]) => b.localeCompare(a))
          .reduce((acc, [date, tasks]) => {
            acc[date] = tasks.sort((a, b) => {
              const aDate = a.completedAt instanceof Date ? a.completedAt : new Date(a.completedAt!);
              const bDate = b.completedAt instanceof Date ? b.completedAt : new Date(b.completedAt!);
              return bDate.getTime() - aDate.getTime();
            });
            return acc;
          }, {} as { [key: string]: Task[] });
      },

      getLabelById: (id) => {
        const { labels } = get();
        return labels.find(label => label.id === id);
      },
    }),
    {
      name: 'task-management-storage',
      partialize: (state) => ({
        tasks: state.tasks,
        labels: state.labels,
        currentView: state.currentView,
        filters: state.filters,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        googleAuthToken: state.googleAuthToken,
        googleCalendars: state.googleCalendars,
        googleEvents: state.googleEvents,
        debugHistory: state.debugHistory,
        maxDebugHistory: state.maxDebugHistory,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // タスクのみを正しく復元（Googleカレンダーイベントは除外）
          if (state.tasks && Array.isArray(state.tasks)) {
            state.tasks = state.tasks
              .filter((task: any) => 
                task && 
                task.id && 
                task.title && 
                task.status && 
                task.priority !== undefined &&
                task.progress !== undefined &&
                task.startDate &&
                task.dueDate &&
                task.createdAt &&
                task.updatedAt
              )
              .map((task: any) => ({
                ...task,
                startDate: new Date(task.startDate),
                dueDate: new Date(task.dueDate),
                createdAt: new Date(task.createdAt),
                updatedAt: new Date(task.updatedAt),
                completedAt: task.completedAt ? 
                  (task.completedAt instanceof Date ? task.completedAt : new Date(task.completedAt)) : 
                  undefined
              }));
          }
          
          // ラベルを正しく復元
          if (state.labels && Array.isArray(state.labels)) {
            state.labels = state.labels.map((label: any) => ({
              ...label,
              createdAt: new Date(label.createdAt)
            }));
          }

          // ラベルが空の場合はデフォルトラベルを設定
          if (!state.labels || state.labels.length === 0) {
            state.labels = getDefaultLabels();
          }

          // Googleカレンダー関連のデータを初期化（存在しない場合）
          if (!state.googleAuthToken) state.googleAuthToken = null;
          if (!state.googleCalendars) state.googleCalendars = [];
          if (!state.googleEvents) state.googleEvents = [];
          if (!state.debugHistory) state.debugHistory = [];
          if (!state.maxDebugHistory) state.maxDebugHistory = 100;
          
          // デバッグ履歴のtimestampを正しく復元
          if (state.debugHistory && Array.isArray(state.debugHistory)) {
            state.debugHistory = state.debugHistory.map((debugInfo: any) => ({
              ...debugInfo,
              timestamp: new Date(debugInfo.timestamp)
            }));
          }
        }
      },
    }
  )
);
