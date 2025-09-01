import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, Label, TaskFilter, SortOption, Goal, DailyRecord, GoalProgress, GoalType, YouTubeVideo, YouTubeFavorite } from '@/types';
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
  currentView: 'todo' | 'gantt' | 'calendar' | 'stats' | 'settings' | 'debug' | 'completed' | 'goals' | 'daily-input' | 'youtube';
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

  // Goal Management State
  goals: Goal[];
  dailyRecords: DailyRecord[];

  // YouTube State
  youtubeVideos: YouTubeVideo[];
  youtubeFavorites: YouTubeFavorite[];
  youtubeSearchQuery: string;
  youtubeCurrentVideo: YouTubeVideo | null;
  youtubeIsLoading: boolean;
  youtubeNextPageToken: string | null;

  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  
  setLabels: (labels: Label[]) => void;
  addLabel: (label: Label) => void;
  updateLabel: (label: Label) => void;
  deleteLabel: (labelId: string) => void;
  
  setCurrentView: (view: 'todo' | 'gantt' | 'calendar' | 'stats' | 'settings' | 'debug' | 'completed' | 'goals' | 'daily-input' | 'youtube') => void;
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
  
  // Goal Management Actions
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (goalId: string) => void;
  setDailyRecords: (records: DailyRecord[]) => void;
  addDailyRecord: (record: DailyRecord) => void;
  updateDailyRecord: (record: DailyRecord) => void;
  deleteDailyRecord: (recordId: string) => void;
  clearAllData: () => void;
  
  // Computed
  getFilteredTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getCompletedTasksByDate: () => { [key: string]: Task[] };
  getLabelById: (id: string) => Label | undefined;
  getGoalsByMonth: (yearMonth: string) => Goal[];
  getDailyRecordsByDate: (date: string) => DailyRecord[];
  getGoalProgress: (goalId: string, yearMonth: string) => GoalProgress | null;
  getCurrentMonthGoals: () => Goal[];
  
  // YouTube Actions
  setYouTubeVideos: (videos: YouTubeVideo[]) => void;
  setYouTubeFavorites: (favorites: YouTubeFavorite[]) => void;
  addYouTubeFavorite: (favorite: YouTubeFavorite) => void;
  removeYouTubeFavorite: (videoId: string) => void;
  setYouTubeSearchQuery: (query: string) => void;
  setYouTubeCurrentVideo: (video: YouTubeVideo | null) => void;
  setYouTubeIsLoading: (loading: boolean) => void;
  setYouTubeNextPageToken: (token: string | null) => void;
  searchYouTubeVideos: (query: string, videoDuration?: 'short' | 'medium' | 'long', append?: boolean) => Promise<void>;
  getPopularYouTubeVideos: (videoDuration?: 'short' | 'medium' | 'long', append?: boolean) => Promise<void>;
  loadMoreVideos: () => Promise<void>;
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

      // Goal Management State
      goals: [],
      dailyRecords: [],

      // YouTube State
      youtubeVideos: [],
      youtubeFavorites: [],
      youtubeSearchQuery: '',
      youtubeCurrentVideo: null,
      youtubeIsLoading: false,
      youtubeNextPageToken: null,

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
      setGoogleRefreshToken: (token) => set({ googleRefreshToken: token }),
      setGoogleTokenExpiry: (expiry) => set({ googleTokenExpiry: expiry }),
      setGoogleCalendars: (calendars) => set({ googleCalendars: calendars }),
      setGoogleEvents: (events) => set({ googleEvents: events }),
      toggleGoogleCalendar: (calendarId) => set((state) => ({
        googleCalendars: state.googleCalendars.map(calendar =>
          calendar.id === calendarId ? { ...calendar, selected: !calendar.selected } : calendar
        )
      })),
      refreshGoogleToken: async () => {
        // リフレッシュトークンを使用して新しいアクセストークンを取得
        // 実装は後で追加
        return false;
      },
      clearGoogleAuth: () => set({
        googleAuthToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        googleCalendars: [],
        googleEvents: []
      }),

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

      // Goal Management Actions
      setGoals: (goals) => set({ goals }),
      addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
      updateGoal: (goal) => set((state) => ({
        goals: state.goals.map(g => g.id === goal.id ? goal : g)
      })),
      deleteGoal: (goalId) => set((state) => ({
        goals: state.goals.filter(g => g.id !== goalId)
      })),
      setDailyRecords: (records) => set({ dailyRecords: records }),
      addDailyRecord: (record) => set((state) => ({ dailyRecords: [...state.dailyRecords, record] })),
      updateDailyRecord: (record) => set((state) => ({
        dailyRecords: state.dailyRecords.map(r => r.id === record.id ? record : r)
      })),
      deleteDailyRecord: (recordId) => set((state) => ({
        dailyRecords: state.dailyRecords.filter(r => r.id !== recordId)
      })),
      
      // 全データを削除
      clearAllData: () => set({
        tasks: [],
        labels: getDefaultLabels(),
        goals: [],
        dailyRecords: [],
        googleEvents: [],
        debugHistory: []
      }),

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

      // Goal Management Computed
      getGoalsByMonth: (yearMonth) => {
        const { goals } = get();
        return goals.filter(goal => goal.yearMonth === yearMonth);
      },

      getDailyRecordsByDate: (date) => {
        const { dailyRecords } = get();
        return dailyRecords.filter(record => record.date === date);
      },

      getGoalProgress: (goalId, yearMonth) => {
        const { goals, dailyRecords } = get();
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return null;

        // 指定月の日次記録を取得
        const monthRecords = dailyRecords.filter(record => {
          const recordYearMonth = record.date.substring(0, 7); // YYYY-MM部分を取得
          return recordYearMonth === yearMonth && record.goalId === goalId;
        });

        // 現在の値を計算
        const currentValue = monthRecords.reduce((sum, record) => sum + record.value, 0);
        
        // 進捗率を計算
        const progressPercentage = goal.targetValue > 0 ? (currentValue / goal.targetValue) * 100 : 0;
        
        // 残り日数を計算
        const today = new Date();
        const year = parseInt(yearMonth.split('-')[0]);
        const month = parseInt(yearMonth.split('-')[1]);
        const lastDayOfMonth = new Date(year, month, 0).getDate();
        const remainingDays = Math.max(0, lastDayOfMonth - today.getDate());

        return {
          goalId: goal.id,
          goalName: goal.name,
          goalType: goal.type,
          targetValue: goal.targetValue,
          currentValue: currentValue,
          unit: goal.unit,
          progressPercentage: progressPercentage,
          isOverdue: progressPercentage < 100 && remainingDays === 0,
          remainingDays: remainingDays
        };
      },

      getCurrentMonthGoals: () => {
        const { goals } = get();
        const currentDate = new Date();
        const yearMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
        return goals.filter(goal => goal.yearMonth === yearMonth);
      },

      // YouTube Actions
      setYouTubeVideos: (videos) => set({ youtubeVideos: videos }),
      setYouTubeFavorites: (favorites) => set({ youtubeFavorites: favorites }),
      addYouTubeFavorite: (favorite) => set((state) => ({ 
        youtubeFavorites: [...state.youtubeFavorites, favorite] 
      })),
      removeYouTubeFavorite: (videoId) => set((state) => ({ 
        youtubeFavorites: state.youtubeFavorites.filter(f => f.videoId !== videoId) 
      })),
      setYouTubeSearchQuery: (query) => set({ youtubeSearchQuery: query }),
      setYouTubeCurrentVideo: (video) => set({ youtubeCurrentVideo: video }),
      setYouTubeIsLoading: (loading) => set({ youtubeIsLoading: loading }),
      setYouTubeNextPageToken: (token) => set({ youtubeNextPageToken: token }),
      
      searchYouTubeVideos: async (query, videoDuration, append = false) => {
        const { setYouTubeVideos, setYouTubeIsLoading, setYouTubeNextPageToken, addDebugInfo, youtubeVideos, youtubeNextPageToken } = get();
        setYouTubeIsLoading(true);
        
        try {
          const { YouTubeAPI } = await import('@/lib/youtube');
          const result = await YouTubeAPI.searchVideos(query, 20, append ? youtubeNextPageToken || undefined : undefined, videoDuration);
          
          if (append) {
            setYouTubeVideos([...youtubeVideos, ...result.videos]);
          } else {
            setYouTubeVideos(result.videos);
          }
          
          setYouTubeNextPageToken(result.nextPageToken || null);
          
          addDebugInfo({
            type: 'general',
            title: 'YouTube Search',
            data: { query, videoDuration, append, results: result.videos.length },
            status: 'success'
          });
        } catch (error) {
          console.error('YouTube search error:', error);
          addDebugInfo({
            type: 'general',
            title: 'YouTube Search Error',
            data: { query, videoDuration, append, error: error instanceof Error ? error.message : String(error) },
            status: 'error'
          });
        } finally {
          setYouTubeIsLoading(false);
        }
      },
      
      getPopularYouTubeVideos: async (videoDuration, append = false) => {
        const { setYouTubeVideos, setYouTubeIsLoading, setYouTubeNextPageToken, addDebugInfo, youtubeVideos, youtubeNextPageToken } = get();
        setYouTubeIsLoading(true);
        
        try {
          const { YouTubeAPI } = await import('@/lib/youtube');
          const result = await YouTubeAPI.getPopularVideos(undefined, 20, videoDuration);
          
          if (append) {
            setYouTubeVideos([...youtubeVideos, ...result.videos]);
          } else {
            setYouTubeVideos(result.videos);
          }
          
          setYouTubeNextPageToken(result.nextPageToken || null);
          
          addDebugInfo({
            type: 'general',
            title: 'YouTube Popular Videos',
            data: { videoDuration, append, results: result.videos.length },
            status: 'success'
          });
        } catch (error) {
          console.error('YouTube popular videos error:', error);
          addDebugInfo({
            type: 'general',
            title: 'YouTube Popular Videos Error',
            data: { videoDuration, append, error: error instanceof Error ? error.message : String(error) },
            status: 'error'
          });
        } finally {
          setYouTubeIsLoading(false);
        }
      },

      loadMoreVideos: async () => {
        const { youtubeSearchQuery, searchYouTubeVideos, getPopularYouTubeVideos } = get();
        
        // 現在のタブと動画長フィルターは外部から渡す必要があるため、
        // このメソッドは使用しない。代わりに直接searchYouTubeVideosやgetPopularYouTubeVideosを呼び出す
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
        googleRefreshToken: state.googleRefreshToken,
        googleTokenExpiry: state.googleTokenExpiry,
        googleCalendars: state.googleCalendars,
        googleEvents: state.googleEvents,
        debugHistory: state.debugHistory,
        maxDebugHistory: state.maxDebugHistory,
        goals: state.goals,
        dailyRecords: state.dailyRecords,
        youtubeVideos: state.youtubeVideos,
        youtubeFavorites: state.youtubeFavorites,
        youtubeNextPageToken: state.youtubeNextPageToken,
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
          
          // 目標関連のデータを初期化（存在しない場合）
          if (!state.goals) state.goals = [];
          if (!state.dailyRecords) state.dailyRecords = [];
          
          // 目標データを正しく復元
          if (state.goals && Array.isArray(state.goals)) {
            state.goals = state.goals.map((goal: any) => ({
              ...goal,
              createdAt: new Date(goal.createdAt),
              updatedAt: new Date(goal.updatedAt)
            }));
          }
          
          // 日次記録データを正しく復元
          if (state.dailyRecords && Array.isArray(state.dailyRecords)) {
            state.dailyRecords = state.dailyRecords.map((record: any) => ({
              ...record,
              createdAt: new Date(record.createdAt),
              updatedAt: new Date(record.updatedAt)
            }));
          }
          
          // YouTubeお気に入りデータを正しく復元
          if (state.youtubeFavorites && Array.isArray(state.youtubeFavorites)) {
            state.youtubeFavorites = state.youtubeFavorites.map((favorite: any) => ({
              ...favorite,
              addedAt: new Date(favorite.addedAt)
            }));
          }
          
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
