import { Task, Label } from '@/types';

const STORAGE_KEYS = {
  TASKS: 'task-management-tasks',
  LABELS: 'task-management-labels',
  SETTINGS: 'task-management-settings'
};

export const storage = {
  // タスクの保存・取得
  saveTasks: (tasks: Task[]): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    }
  },

  getTasks: (): Task[] => {
    if (typeof window === 'undefined') return [];
    
    const tasksJson = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!tasksJson) return [];
    
    const tasks = JSON.parse(tasksJson);
    return tasks.map((task: any) => ({
      ...task,
      startDate: new Date(task.startDate),
      dueDate: new Date(task.dueDate),
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt)
    }));
  },

  // ラベルの保存・取得
  saveLabels: (labels: Label[]): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LABELS, JSON.stringify(labels));
    }
  },

  getLabels: (): Label[] => {
    if (typeof window === 'undefined') return [];
    
    const labelsJson = localStorage.getItem(STORAGE_KEYS.LABELS);
    if (!labelsJson) return [];
    
    const labels = JSON.parse(labelsJson);
    return labels.map((label: any) => ({
      ...label,
      createdAt: new Date(label.createdAt)
    }));
  },

  // 設定の保存・取得
  saveSettings: (settings: any): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }
  },

  getSettings: (): any => {
    if (typeof window === 'undefined') return {};
    
    const settingsJson = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return settingsJson ? JSON.parse(settingsJson) : {};
  },

  // データのエクスポート
  exportData: (): string => {
    const data = {
      tasks: storage.getTasks(),
      labels: storage.getLabels(),
      settings: storage.getSettings(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  },

  // データのインポート
  importData: (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.tasks) storage.saveTasks(data.tasks);
      if (data.labels) storage.saveLabels(data.labels);
      if (data.settings) storage.saveSettings(data.settings);
      return true;
    } catch (error) {
      console.error('データのインポートに失敗しました:', error);
      return false;
    }
  }
};
