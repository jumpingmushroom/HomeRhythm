import { create } from 'zustand';
import { Task, TaskCompletion, User } from '../types';

interface TasksState {
  tasks: Task[];
  selectedTask: Task | null;
  completions: Record<number, TaskCompletion[]>;
  userMap: Record<number, User>;
  filters: {
    category: string | null;
    priority: string | null;
    search: string;
    assignmentFilter: 'all' | 'created' | 'assigned' | 'unassigned';
  };
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: number) => void;
  setSelectedTask: (task: Task | null) => void;
  setCompletions: (taskId: number, completions: TaskCompletion[]) => void;
  addCompletion: (completion: TaskCompletion) => void;
  setUser: (user: User) => void;
  setFilters: (filters: Partial<TasksState['filters']>) => void;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  selectedTask: null,
  completions: {},
  userMap: {},
  filters: {
    category: null,
    priority: null,
    search: '',
    assignmentFilter: 'all',
  },

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),

  updateTask: (task) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
    selectedTask: state.selectedTask?.id === task.id ? task : state.selectedTask,
  })),

  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter((t) => t.id !== id),
    selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
  })),

  setSelectedTask: (task) => set({ selectedTask: task }),

  setCompletions: (taskId, completions) => set((state) => ({
    completions: { ...state.completions, [taskId]: completions },
  })),

  addCompletion: (completion) => set((state) => ({
    completions: {
      ...state.completions,
      [completion.task_id]: [
        completion,
        ...(state.completions[completion.task_id] || []),
      ],
    },
  })),

  setUser: (user) => set((state) => ({
    userMap: { ...state.userMap, [user.id]: user },
  })),

  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),
}));
