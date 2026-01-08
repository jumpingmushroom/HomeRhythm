export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  assigned_to: number | null;
  title: string;
  description: string | null;
  category: string;
  recurrence_type: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'seasonal';
  recurrence_interval: number | null;
  recurrence_config: string | null; // JSON string for complex patterns
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
  suggested_recurrence_type: string;
  suggested_recurrence_interval: number | null;
  suggested_recurrence_config: string | null;
  is_system_template: number;
  created_at: string;
}

export interface AuthRequest extends Express.Request {
  userId?: number;
}
