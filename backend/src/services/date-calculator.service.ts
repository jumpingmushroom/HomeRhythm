import { Task, TaskCompletion } from '../types';
import { getDatabase } from '../database';

export class DateCalculatorService {

  /**
   * Calculate the next due date for a recurring task based on last completion
   */
  calculateNextDueDate(task: Task, lastCompletedAt?: string): string | null {
    if (task.schedule_type === 'once') {
      return task.due_date;
    }

    if (!task.recurrence_pattern || !task.recurrence_interval) {
      return null;
    }

    const baseDate = lastCompletedAt
      ? new Date(lastCompletedAt)
      : task.due_date
        ? new Date(task.due_date)
        : new Date(task.created_at);
    const interval = task.recurrence_interval;

    let nextDate = new Date(baseDate);

    switch (task.recurrence_pattern) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + interval);
        break;

      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (interval * 7));
        break;

      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;

      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + interval);
        break;

      case 'seasonal':
        // Seasonal = 3 months
        nextDate.setMonth(nextDate.getMonth() + (interval * 3));
        break;

      default:
        return null;
    }

    // Handle recurrence_config for complex patterns (e.g., specific weekdays)
    if (task.recurrence_config) {
      try {
        const config = JSON.parse(task.recurrence_config);

        // Example: Weekly on specific days
        if (task.recurrence_pattern === 'weekly' && config.weekdays) {
          // Find next occurrence on specified weekday
          const targetDays = config.weekdays as number[]; // 0=Sunday, 6=Saturday
          const currentDay = nextDate.getDay();

          // Find next matching day
          let daysToAdd = 0;
          for (let i = 1; i <= 7; i++) {
            const checkDay = (currentDay + i) % 7;
            if (targetDays.includes(checkDay)) {
              daysToAdd = i;
              break;
            }
          }

          nextDate.setDate(nextDate.getDate() + daysToAdd);
        }

        // Example: Monthly on specific date
        if (task.recurrence_pattern === 'monthly' && config.day_of_month) {
          nextDate.setDate(config.day_of_month);
        }
      } catch (error) {
        console.error('Error parsing recurrence_config:', error);
      }
    }

    return nextDate.toISOString().split('T')[0]; // Return YYYY-MM-DD
  }

  /**
   * Get the last completion date for a task
   */
  getLastCompletionDate(taskId: number): string | null {
    const db = getDatabase();
    const completion = db.prepare(`
      SELECT completed_at FROM task_completions
      WHERE task_id = ?
      ORDER BY completed_at DESC
      LIMIT 1
    `).get(taskId) as TaskCompletion | undefined;

    return completion?.completed_at || null;
  }

  /**
   * Calculate if a task is overdue and days until due
   */
  calculateTaskStatus(task: Task): {
    nextDueDate: string | null;
    isOverdue: boolean;
    daysUntilDue: number | null;
    lastCompletedAt: string | null;
  } {
    const lastCompletedAt = this.getLastCompletionDate(task.id);
    const nextDueDate = this.calculateNextDueDate(task, lastCompletedAt || undefined);

    if (!nextDueDate) {
      return { nextDueDate: null, isOverdue: false, daysUntilDue: null, lastCompletedAt };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(nextDueDate);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isOverdue = daysUntilDue < 0;

    return { nextDueDate, isOverdue, daysUntilDue, lastCompletedAt };
  }

  /**
   * Check if task should trigger a "due soon" notification
   */
  isTaskDueSoon(task: Task, dueSoonDays: number): boolean {
    const { daysUntilDue, isOverdue } = this.calculateTaskStatus(task);

    if (isOverdue || daysUntilDue === null) {
      return false;
    }

    return daysUntilDue > 0 && daysUntilDue <= dueSoonDays;
  }
}

export const dateCalculatorService = new DateCalculatorService();
