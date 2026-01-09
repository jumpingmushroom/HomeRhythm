import { Task } from '../types';
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  parseISO,
  startOfDay,
  differenceInDays,
  getDay,
  setDate as setDayOfMonth
} from 'date-fns';

/**
 * Calculate the next due date for a task based on its schedule type and last completion
 * This mirrors the backend DateCalculatorService logic
 */
export function calculateNextDueDate(
  task: Task,
  lastCompletedAt?: string
): Date | null {
  // One-time tasks: return the due_date
  if (task.schedule_type === 'once') {
    return task.due_date ? parseISO(task.due_date) : null;
  }

  // Recurring tasks need a pattern and interval
  if (!task.recurrence_pattern || !task.recurrence_interval) {
    return null;
  }

  // Calculate from last completion, or creation date if never completed
  const baseDate = lastCompletedAt
    ? parseISO(lastCompletedAt)
    : parseISO(task.created_at);

  const interval = task.recurrence_interval;
  let nextDate = new Date(baseDate);

  // Calculate based on recurrence pattern
  switch (task.recurrence_pattern) {
    case 'daily':
      nextDate = addDays(nextDate, interval);
      break;

    case 'weekly':
      nextDate = addWeeks(nextDate, interval);
      break;

    case 'monthly':
      nextDate = addMonths(nextDate, interval);
      break;

    case 'yearly':
      nextDate = addYears(nextDate, interval);
      break;

    case 'seasonal':
      // Seasonal = 3 months per interval
      nextDate = addMonths(nextDate, interval * 3);
      break;

    default:
      return null;
  }

  // Handle recurrence_config for complex patterns
  if (task.recurrence_config) {
    try {
      const config = JSON.parse(task.recurrence_config);

      // Weekly on specific days (e.g., every Monday and Wednesday)
      if (task.recurrence_pattern === 'weekly' && config.weekdays) {
        const targetDays = config.weekdays as number[]; // 0=Sunday, 6=Saturday
        const currentDay = getDay(nextDate);

        // Find next matching day
        let daysToAdd = 0;
        for (let i = 1; i <= 7; i++) {
          const checkDay = (currentDay + i) % 7;
          if (targetDays.includes(checkDay)) {
            daysToAdd = i;
            break;
          }
        }

        nextDate = addDays(nextDate, daysToAdd);
      }

      // Monthly on specific date (e.g., 15th of every month)
      if (task.recurrence_pattern === 'monthly' && config.day_of_month) {
        nextDate = setDayOfMonth(nextDate, config.day_of_month);
      }
    } catch (error) {
      console.error('Error parsing recurrence_config:', error);
    }
  }

  return nextDate;
}

/**
 * Check if a task is overdue based on its next due date
 */
export function isTaskOverdue(nextDueDate: Date): boolean {
  const today = startOfDay(new Date());
  const dueDate = startOfDay(nextDueDate);

  return dueDate < today;
}

/**
 * Calculate days until a task is due (negative if overdue)
 */
export function daysUntilDue(nextDueDate: Date): number {
  const today = startOfDay(new Date());
  const dueDate = startOfDay(nextDueDate);

  return differenceInDays(dueDate, today);
}

/**
 * Calculate comprehensive task status including due date, overdue status, and days until due
 */
export function calculateTaskStatus(
  task: Task,
  lastCompletedAt?: string
): {
  nextDueDate: Date | null;
  isOverdue: boolean;
  daysUntilDue: number | null;
} {
  const nextDueDate = calculateNextDueDate(task, lastCompletedAt);

  if (!nextDueDate) {
    return {
      nextDueDate: null,
      isOverdue: false,
      daysUntilDue: null,
    };
  }

  const days = daysUntilDue(nextDueDate);
  const overdue = isTaskOverdue(nextDueDate);

  return {
    nextDueDate,
    isOverdue: overdue,
    daysUntilDue: days,
  };
}

/**
 * Check if a task should be considered "due soon" based on threshold
 */
export function isTaskDueSoon(
  task: Task,
  dueSoonDays: number,
  lastCompletedAt?: string
): boolean {
  const { daysUntilDue: days, isOverdue: overdue } = calculateTaskStatus(
    task,
    lastCompletedAt
  );

  if (overdue || days === null) {
    return false;
  }

  return days > 0 && days <= dueSoonDays;
}
