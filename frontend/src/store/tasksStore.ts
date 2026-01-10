import { create } from 'zustand';
import {
  Task,
  TaskCompletion,
  User,
  TaskSubtask,
  DependencyWithTask,
  TaskTimeEntry,
  TaskCommentWithUser
} from '../types';

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

  // Advanced task features
  subtasks: Record<number, TaskSubtask[]>;
  dependencies: Record<number, DependencyWithTask[]>;
  timeEntries: Record<number, TaskTimeEntry[]>;
  activeTimer: TaskTimeEntry | null;
  comments: Record<number, TaskCommentWithUser[]>;

  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: number) => void;
  setSelectedTask: (task: Task | null) => void;
  setCompletions: (taskId: number, completions: TaskCompletion[]) => void;
  addCompletion: (completion: TaskCompletion) => void;
  setUser: (user: User) => void;
  setFilters: (filters: Partial<TasksState['filters']>) => void;

  // Subtasks actions
  setSubtasks: (taskId: number, subtasks: TaskSubtask[]) => void;
  addSubtask: (subtask: TaskSubtask) => void;
  updateSubtask: (subtask: TaskSubtask) => void;
  deleteSubtask: (taskId: number, subtaskId: number) => void;

  // Dependencies actions
  setDependencies: (taskId: number, dependencies: DependencyWithTask[]) => void;
  addDependency: (dependency: DependencyWithTask) => void;
  removeDependency: (taskId: number, dependencyId: number) => void;

  // Time tracking actions
  setTimeEntries: (taskId: number, entries: TaskTimeEntry[]) => void;
  setActiveTimer: (entry: TaskTimeEntry | null) => void;
  addTimeEntry: (entry: TaskTimeEntry) => void;
  updateTimeEntry: (entry: TaskTimeEntry) => void;
  deleteTimeEntry: (taskId: number, entryId: number) => void;

  // Comments actions
  setComments: (taskId: number, comments: TaskCommentWithUser[]) => void;
  addComment: (comment: TaskCommentWithUser) => void;
  updateComment: (comment: TaskCommentWithUser) => void;
  deleteComment: (taskId: number, commentId: number) => void;
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
  subtasks: {},
  dependencies: {},
  timeEntries: {},
  activeTimer: null,
  comments: {},

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

  // Subtasks actions
  setSubtasks: (taskId, subtasks) => set((state) => ({
    subtasks: { ...state.subtasks, [taskId]: subtasks },
  })),

  addSubtask: (subtask) => set((state) => ({
    subtasks: {
      ...state.subtasks,
      [subtask.task_id]: [
        ...(state.subtasks[subtask.task_id] || []),
        subtask,
      ],
    },
  })),

  updateSubtask: (subtask) => set((state) => ({
    subtasks: {
      ...state.subtasks,
      [subtask.task_id]: (state.subtasks[subtask.task_id] || []).map((s) =>
        s.id === subtask.id ? subtask : s
      ),
    },
  })),

  deleteSubtask: (taskId, subtaskId) => set((state) => ({
    subtasks: {
      ...state.subtasks,
      [taskId]: (state.subtasks[taskId] || []).filter((s) => s.id !== subtaskId),
    },
  })),

  // Dependencies actions
  setDependencies: (taskId, dependencies) => set((state) => ({
    dependencies: { ...state.dependencies, [taskId]: dependencies },
  })),

  addDependency: (dependency) => set((state) => ({
    dependencies: {
      ...state.dependencies,
      [dependency.task_id]: [
        ...(state.dependencies[dependency.task_id] || []),
        dependency,
      ],
    },
  })),

  removeDependency: (taskId, dependencyId) => set((state) => ({
    dependencies: {
      ...state.dependencies,
      [taskId]: (state.dependencies[taskId] || []).filter((d) => d.id !== dependencyId),
    },
  })),

  // Time tracking actions
  setTimeEntries: (taskId, entries) => set((state) => ({
    timeEntries: { ...state.timeEntries, [taskId]: entries },
  })),

  setActiveTimer: (entry) => set({ activeTimer: entry }),

  addTimeEntry: (entry) => set((state) => ({
    timeEntries: {
      ...state.timeEntries,
      [entry.task_id]: [
        entry,
        ...(state.timeEntries[entry.task_id] || []),
      ],
    },
  })),

  updateTimeEntry: (entry) => set((state) => ({
    timeEntries: {
      ...state.timeEntries,
      [entry.task_id]: (state.timeEntries[entry.task_id] || []).map((e) =>
        e.id === entry.id ? entry : e
      ),
    },
  })),

  deleteTimeEntry: (taskId, entryId) => set((state) => ({
    timeEntries: {
      ...state.timeEntries,
      [taskId]: (state.timeEntries[taskId] || []).filter((e) => e.id !== entryId),
    },
  })),

  // Comments actions
  setComments: (taskId, comments) => set((state) => ({
    comments: { ...state.comments, [taskId]: comments },
  })),

  addComment: (comment) => set((state) => ({
    comments: {
      ...state.comments,
      [comment.task_id]: [
        comment,
        ...(state.comments[comment.task_id] || []),
      ],
    },
  })),

  updateComment: (comment) => set((state) => ({
    comments: {
      ...state.comments,
      [comment.task_id]: (state.comments[comment.task_id] || []).map((c) =>
        c.id === comment.id ? comment : c
      ),
    },
  })),

  deleteComment: (taskId, commentId) => set((state) => ({
    comments: {
      ...state.comments,
      [taskId]: (state.comments[taskId] || []).filter((c) => c.id !== commentId),
    },
  })),
}));
