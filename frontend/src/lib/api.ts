import axios from 'axios';
import { Task, TaskCompletion, TaskTemplate, CreateTaskInput, User, NotificationPreferences, UpdateNotificationPreferencesInput, Household, HouseholdInvite, HouseholdMember, Activity } from '../types';

const api = axios.create({
  baseURL: '/api',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  register: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/register', { email, password }),

  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }),

  me: () =>
    api.get<{ user: User }>('/auth/me'),
};

// Tasks
export const tasksApi = {
  getAll: (params?: { category?: string; priority?: string; search?: string; filter?: 'created' | 'assigned' }) =>
    api.get<{ tasks: Task[] }>('/tasks', { params }),

  getOne: (id: number) =>
    api.get<{ task: Task }>(`/tasks/${id}`),

  create: (data: CreateTaskInput) =>
    api.post<{ task: Task }>('/tasks', data),

  update: (id: number, data: Partial<CreateTaskInput>) =>
    api.put<{ task: Task }>(`/tasks/${id}`, data),

  delete: (id: number) =>
    api.delete(`/tasks/${id}`),
};

// Completions
export const completionsApi = {
  getForTask: (taskId: number) =>
    api.get<{ completions: TaskCompletion[] }>(`/completions/task/${taskId}`),

  getLastForTask: (taskId: number) =>
    api.get<{ completion: TaskCompletion }>(`/completions/task/${taskId}/last`),

  create: (taskId: number, data: { completed_at: string; completion_notes?: string }) =>
    api.post<{ completion: TaskCompletion }>(`/completions/task/${taskId}`, data),

  update: (id: number, data: { completed_at?: string; completion_notes?: string }) =>
    api.put<{ completion: TaskCompletion }>(`/completions/${id}`, data),

  delete: (id: number) =>
    api.delete(`/completions/${id}`),
};

// Photos
export const photosApi = {
  upload: (completionId: number, files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('photos', file);
    });
    return api.post(`/photos/completion/${completionId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getUrl: (id: number) => `/api/photos/${id}`,

  delete: (id: number) =>
    api.delete(`/photos/${id}`),
};

// Templates
export const templatesApi = {
  getAll: (params?: { category?: string }) =>
    api.get<{ templates: TaskTemplate[] }>('/templates', { params }),

  getByCategory: () =>
    api.get<{ templates: Record<string, TaskTemplate[]> }>('/templates/by-category'),

  getOne: (id: number) =>
    api.get<{ template: TaskTemplate }>(`/templates/${id}`),
};

// Users
export const usersApi = {
  getAll: (params?: { search?: string }) =>
    api.get<{ users: User[] }>('/users', { params }),

  getOne: (id: number) =>
    api.get<{ user: User }>(`/users/${id}`),
};

// Notification Preferences
export const notificationPreferencesApi = {
  get: () =>
    api.get<{ preferences: NotificationPreferences }>('/notification-preferences'),

  update: (data: UpdateNotificationPreferencesInput) =>
    api.put<{ message: string; preferences: NotificationPreferences }>(
      '/notification-preferences',
      data
    ),

  sendTestEmail: () =>
    api.post<{ message: string }>('/notification-preferences/test'),
};

// Households
export const householdsApi = {
  get: () =>
    api.get<{ household: Household | null; members: HouseholdMember[]; invites: HouseholdInvite[] }>('/households'),

  create: (name: string) =>
    api.post<{ household: Household }>('/households', { name }),

  update: (name: string) =>
    api.put<{ household: Household }>('/households', { name }),

  createInvite: (email: string) =>
    api.post<{ invite: HouseholdInvite; inviteLink: string }>('/households/invites', { email }),

  acceptInvite: (inviteCode: string) =>
    api.post<{ household: Household }>('/households/invites/accept', { invite_code: inviteCode }),

  deleteInvite: (inviteId: number) =>
    api.delete(`/households/invites/${inviteId}`),

  leave: () =>
    api.post('/households/leave'),
};

// Activities
export const activitiesApi = {
  getAll: (limit?: number) =>
    api.get<{ activities: Activity[] }>('/activities', { params: { limit } }),
};
