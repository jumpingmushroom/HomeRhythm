export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  assigned_to: number | null;
  title: string;
  description: string | null;
  category: string;
  schedule_type: 'once' | 'recurring';
  due_date: string | null;
  flexibility_window: 'exact_date' | 'within_week' | 'within_month' | 'within_year' | null;
  recurrence_pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'seasonal' | null;
  recurrence_interval: number | null;
  recurrence_config: string | null;
  priority: 'low' | 'medium' | 'high';
  estimated_time: number | null;
  estimated_cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCompletion {
  id: number;
  task_id: number;
  completed_at: string;
  completion_notes: string | null;
  created_at: string;
  photos?: TaskPhoto[];
}

export interface TaskPhoto {
  id: number;
  completion_id: number;
  file_path: string;
  created_at: string;
}

export interface TaskTemplate {
  id: number;
  title: string;
  description: string | null;
  category: string;
  suggested_recurrence_pattern: string;
  suggested_recurrence_interval: number | null;
  suggested_recurrence_config: string | null;
  is_system_template: number;
  created_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  category: string;
  schedule_type: 'once' | 'recurring';
  due_date?: string;
  flexibility_window?: 'exact_date' | 'within_week' | 'within_month' | 'within_year';
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'seasonal';
  recurrence_interval?: number;
  recurrence_config?: string;
  priority?: 'low' | 'medium' | 'high';
  estimated_time?: number;
  estimated_cost?: number;
  notes?: string;
  assigned_to?: number;
}

export const CATEGORIES = [
  'exterior',
  'hvac',
  'appliances',
  'landscaping',
  'plumbing',
  'electrical',
  'general',
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  exterior: 'bg-blue-100 text-blue-800 border-blue-200',
  hvac: 'bg-orange-100 text-orange-800 border-orange-200',
  appliances: 'bg-purple-100 text-purple-800 border-purple-200',
  landscaping: 'bg-green-100 text-green-800 border-green-200',
  plumbing: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  electrical: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  general: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-gray-600',
  medium: 'text-yellow-600',
  high: 'text-red-600',
};
