export interface User {
  id: number;
  email: string;
  password_hash: string;
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
  due_date: string | null; // ISO 8601 date format for one-time tasks
  flexibility_window: 'exact_date' | 'within_week' | 'within_month' | 'within_year' | null;
  recurrence_pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'seasonal' | null;
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
  suggested_recurrence_pattern: string;
  suggested_recurrence_interval: number | null;
  suggested_recurrence_config: string | null;
  is_system_template: number;
  created_at: string;
}

export interface AuthRequest extends Express.Request {
  userId?: number;
}

export interface NotificationPreferences {
  id: number;
  user_id: number;
  notifications_enabled: number; // SQLite boolean (0/1)
  task_due_soon_days: number;
  task_due_soon_enabled: number;
  task_overdue_enabled: number;
  task_assigned_enabled: number;
  digest_enabled: number;
  digest_frequency: 'daily' | 'weekly';
  digest_time: string; // HH:MM format
  digest_day_of_week: number; // 1-7 (1=Monday)
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: number;
  user_id: number;
  task_id: number | null;
  notification_type: 'due_soon' | 'overdue' | 'assigned' | 'digest';
  reference_date: string;
  sent_at: string;
  status: 'sent' | 'failed';
  error_message: string | null;
}

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  type: 'due_soon' | 'overdue' | 'assigned' | 'digest';
  userId: number;
  taskId?: number;
  referenceDate: string;
}

export interface TaskWithNextDue extends Task {
  next_due_date?: string | null;
  is_overdue?: boolean;
  days_until_due?: number;
  last_completed_at?: string | null;
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
  invited_by: number;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

export interface Activity {
  id: number;
  household_id: number;
  user_id: number;
  activity_type: 'task_created' | 'task_completed' | 'task_assigned' | 'task_updated' | 'task_deleted' | 'subtask_completed' | 'dependency_added' | 'time_tracked' | 'comment_added';
  task_id: number | null;
  metadata: string | null;
  created_at: string;
}

export interface ActivityMetadata {
  task_title?: string;
  assigned_to?: number;
  assigned_to_email?: string;
  completion_notes?: string;
  changes?: Record<string, { old: any; new: any }>;
  action?: string;
  subtask_text?: string;
  completed?: boolean;
  depends_on_task_title?: string;
  duration_minutes?: number;
  comment_preview?: string;
}

export interface ActivityWithDetails extends Activity {
  user_email: string;
  task_title: string | null;
  parsed_metadata: ActivityMetadata | null;
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
