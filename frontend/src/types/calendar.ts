import { Task } from './index';

/**
 * Calendar event interface for react-big-calendar
 */
export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: {
    task: Task;
    category: string;
    priority: string;
    isOverdue: boolean;
    lastCompleted?: string;
  };
}

/**
 * Calendar view types supported by react-big-calendar
 */
export type CalendarView = 'month' | 'week' | 'day' | 'agenda';
