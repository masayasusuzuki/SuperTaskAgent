export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'on-hold';
  priority: 'high' | 'medium' | 'low';
  label: string;
  startDate: Date;
  dueDate: Date;
  progress: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date; // 完了日時（完了時に設定）
}

export interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface TaskFilter {
  status?: Task['status'];
  priority?: Task['priority'];
  label?: string;
  search?: string;
}

export type SortOption = 'dueDate' | 'createdAt' | 'priority' | 'title';

// 目標関連の型定義
export type GoalType = 'task' | 'time' | 'balance' | 'habit';

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  targetValue: number;
  unit: string; // 個、時間、回、冊など
  description?: string;
  isActive: boolean;
  yearMonth: string; // YYYY-MM形式
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyRecord {
  id: string;
  date: string; // YYYY-MM-DD形式
  goalId: string;
  value: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalProgress {
  goalId: string;
  goalName: string;
  goalType: GoalType;
  targetValue: number;
  currentValue: number;
  unit: string;
  progressPercentage: number;
  isOverdue: boolean;
  remainingDays: number;
}

// YouTube関連の型定義
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  likeCount: string;
  videoId: string;
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[];
  nextPageToken?: string;
  totalResults: number;
}

export interface YouTubeFavorite {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  addedAt: Date;
  notes?: string;
}

export interface AppState {
  tasks: Task[];
  labels: Label[];
  currentView: 'todo' | 'gantt' | 'calendar' | 'stats' | 'settings' | 'debug' | 'completed' | 'goals' | 'daily-input' | 'youtube';
  filters: TaskFilter;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
}
