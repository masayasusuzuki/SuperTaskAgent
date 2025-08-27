import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, Label, TaskFilter, SortOption } from '@/types';
import { storage } from '@/lib/storage';

interface TaskStore {
  // State
  tasks: Task[];
  labels: Label[];
  currentView: 'todo' | 'gantt' | 'stats' | 'settings';
  selectedLabel: string | null;
  filters: TaskFilter;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';

  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  
  setLabels: (labels: Label[]) => void;
  addLabel: (label: Label) => void;
  updateLabel: (label: Label) => void;
  deleteLabel: (labelId: string) => void;
  
  setCurrentView: (view: 'todo' | 'gantt' | 'stats' | 'settings') => void;
  setSelectedLabel: (labelId: string | null) => void;
  setFilters: (filters: TaskFilter) => void;
  setSortBy: (sortBy: SortOption) => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  
  // Computed
  getFilteredTasks: () => Task[];
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

      // Computed
      getFilteredTasks: () => {
        const { tasks, filters, selectedLabel } = get();
        let filtered = tasks;

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
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Dateオブジェクトを正しく復元
          state.tasks = state.tasks.map((task: any) => ({
            ...task,
            startDate: new Date(task.startDate),
            dueDate: new Date(task.dueDate),
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt)
          }));
          
          state.labels = state.labels.map((label: any) => ({
            ...label,
            createdAt: new Date(label.createdAt)
          }));

          // ラベルが空の場合はデフォルトラベルを設定
          if (state.labels.length === 0) {
            state.labels = getDefaultLabels();
          }
        }
      },
    }
  )
);
