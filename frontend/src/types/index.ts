export interface User {
  id: number;
  email: string;
  household_id: number | null;
  created_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  household_id: number | null;
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

export interface TemplateSubtask {
  id: number;
  template_id: number;
  text: string;
  position: number;
  created_at: string;
}

export interface TaskTemplateWithSubtasks extends TaskTemplate {
  subtasks: TemplateSubtask[];
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

export interface NotificationPreferences {
  id: number;
  user_id: number;
  notifications_enabled: number;       // 0 or 1 (SQLite boolean)
  task_due_soon_days: number;          // 1-30 days
  task_due_soon_enabled: number;       // 0 or 1
  task_overdue_enabled: number;        // 0 or 1
  task_assigned_enabled: number;       // 0 or 1
  digest_enabled: number;              // 0 or 1
  digest_frequency: 'daily' | 'weekly';
  digest_time: string;                 // HH:MM format
  digest_day_of_week: number;          // 1-7 (Monday-Sunday)
  created_at: string;
  updated_at: string;
}

export interface UpdateNotificationPreferencesInput {
  notifications_enabled?: number;
  task_due_soon_days?: number;
  task_due_soon_enabled?: number;
  task_overdue_enabled?: number;
  task_assigned_enabled?: number;
  digest_enabled?: number;
  digest_frequency?: 'daily' | 'weekly';
  digest_time?: string;
  digest_day_of_week?: number;
}

export interface Household {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
}

export interface HouseholdInvite {
  id: number;
  household_id: number;
  email: string;
  invite_code: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

export interface HouseholdMember extends User {
  // Same as User but clearer naming for context
}

export interface Activity {
  id: number;
  household_id: number;
  user_id: number;
  user_email: string;
  activity_type: 'task_created' | 'task_completed' | 'task_assigned' | 'task_updated' | 'task_deleted' | 'subtask_completed' | 'dependency_added' | 'time_tracked' | 'comment_added';
  task_id: number | null;
  task_title: string | null;
  metadata: string | null;
  parsed_metadata: ActivityMetadata | null;
  created_at: string;
}

export interface ActivityMetadata {
  task_title?: string;
  assigned_to?: number;
  assigned_to_email?: string;
  completion_notes?: string;
  changes?: Record<string, { old: any; new: any }>;
}

// Advanced Task Features
export interface TaskSubtask {
  id: number;
  task_id: number;
  text: string;
  completed: number; // SQLite boolean (0/1)
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TaskDependency {
  id: number;
  task_id: number;
  depends_on_task_id: number;
  created_at: string;
}

export interface DependencyWithTask extends TaskDependency {
  depends_on_task_title: string;
  depends_on_task_completed: boolean;
}

export interface TaskTimeEntry {
  id: number;
  task_id: number;
  user_id: number;
  started_at: string;
  ended_at: string | null;
  duration: number | null; // seconds
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskTimeEntrySummary {
  task_id: number;
  total_duration: number; // seconds
  entry_count: number;
  user_breakdown: Array<{
    user_id: number;
    user_email: string;
    duration: number;
  }>;
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  comment_text: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TaskCommentWithUser extends TaskComment {
  user_email: string;
}
