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

export interface AppState {
  tasks: Task[];
  labels: Label[];
  currentView: 'todo' | 'gantt' | 'calendar' | 'stats' | 'settings' | 'debug' | 'completed';
  filters: TaskFilter;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
}
