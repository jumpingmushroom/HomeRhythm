import { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS, nb } from 'date-fns/locale';
import { AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Task, CATEGORY_COLORS } from '../types';
import { CalendarEvent } from '../types/calendar';
import { calculateNextDueDate, isTaskOverdue } from '../utils/date-calculator';
import 'react-big-calendar/lib/css/react-big-calendar.css';

interface CalendarViewProps {
  tasks: Task[];
  lastCompletions: Record<number, string>;
  onTaskClick: (task: Task) => void;
}

export function CalendarView({ tasks, lastCompletions, onTaskClick }: CalendarViewProps) {
  const { t, i18n } = useTranslation();
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Set up localizer based on current language
  const localizer = useMemo(
    () =>
      dateFnsLocalizer({
        format,
        parse,
        startOfWeek,
        getDay,
        locales: { 'en': enUS, 'no': nb },
      }),
    []
  );

  // Transform tasks into calendar events
  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];

    tasks.forEach((task) => {
      const lastCompleted = lastCompletions[task.id];
      const nextDue = calculateNextDueDate(task, lastCompleted);

      if (!nextDue) {
        return; // Skip tasks without a due date
      }

      const overdue = isTaskOverdue(nextDue);

      calendarEvents.push({
        id: task.id,
        title: task.title,
        start: nextDue,
        end: nextDue,
        allDay: true,
        resource: {
          task,
          category: task.category,
          priority: task.priority,
          isOverdue: overdue,
          lastCompleted,
        },
      });
    });

    return calendarEvents;
  }, [tasks, lastCompletions]);

  // Custom event renderer
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const categoryColor = CATEGORY_COLORS[event.resource.category] || CATEGORY_COLORS.general;
    const isOverdue = event.resource.isOverdue;
    const priority = event.resource.priority;

    return (
      <div className={`flex items-center gap-1 px-1 py-0.5 ${isOverdue ? 'border-l-2 border-red-500' : ''}`}>
        {/* Priority indicator */}
        {priority === 'high' && <ArrowUp className="w-3 h-3 text-red-600 flex-shrink-0" />}
        {priority === 'low' && <ArrowDown className="w-3 h-3 text-gray-500 flex-shrink-0" />}
        {isOverdue && <AlertCircle className="w-3 h-3 text-red-600 flex-shrink-0" />}

        {/* Task title */}
        <span className="text-xs truncate flex-1">{event.title}</span>

        {/* Category badge */}
        <span className={`text-[10px] px-1 rounded border ${categoryColor} flex-shrink-0`}>
          {event.resource.category}
        </span>
      </div>
    );
  };

  // Custom toolbar
  const CustomToolbar = ({ label, onNavigate, onView, view }: any) => {
    return (
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('PREV')}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {t('calendar.previous')}
          </button>
          <button
            onClick={() => onNavigate('TODAY')}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t('calendar.today')}
          </button>
          <button
            onClick={() => onNavigate('NEXT')}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {t('calendar.next')}
          </button>
        </div>

        {/* Current date label */}
        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {label}
        </div>

        {/* View switcher */}
        <div className="flex gap-1">
          <button
            onClick={() => onView('month')}
            className={`px-3 py-1.5 text-sm rounded ${
              view === 'month'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('calendar.month')}
          </button>
          <button
            onClick={() => onView('week')}
            className={`hidden sm:block px-3 py-1.5 text-sm rounded ${
              view === 'week'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('calendar.week')}
          </button>
          <button
            onClick={() => onView('day')}
            className={`hidden sm:block px-3 py-1.5 text-sm rounded ${
              view === 'day'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('calendar.day')}
          </button>
          <button
            onClick={() => onView('agenda')}
            className={`px-3 py-1.5 text-sm rounded ${
              view === 'agenda'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('calendar.agenda')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 calendar-container">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        view={currentView}
        onView={setCurrentView}
        date={currentDate}
        onNavigate={setCurrentDate}
        onSelectEvent={(event: CalendarEvent) => onTaskClick(event.resource.task)}
        components={{
          event: EventComponent,
          toolbar: CustomToolbar,
        }}
        culture={i18n.language}
        messages={{
          today: t('calendar.today'),
          previous: t('calendar.previous'),
          next: t('calendar.next'),
          month: t('calendar.month'),
          week: t('calendar.week'),
          day: t('calendar.day'),
          agenda: t('calendar.agenda'),
          noEventsInRange: t('calendar.noTasksOnDate'),
        }}
      />

      <style>{`
        /* Dark mode styles */
        .dark .calendar-container .rbc-calendar {
          background-color: #1f2937;
          color: #f3f4f6;
        }

        .dark .calendar-container .rbc-header {
          background-color: #374151;
          color: #f3f4f6;
          border-color: #4b5563;
        }

        .dark .calendar-container .rbc-header + .rbc-header {
          border-left-color: #4b5563;
        }

        .dark .calendar-container .rbc-month-view,
        .dark .calendar-container .rbc-time-view,
        .dark .calendar-container .rbc-agenda-view {
          background-color: #1f2937;
          border-color: #4b5563;
        }

        .dark .calendar-container .rbc-day-bg {
          background-color: #1f2937;
          border-color: #4b5563;
        }

        .dark .calendar-container .rbc-today {
          background-color: #1e3a5f;
        }

        .dark .calendar-container .rbc-off-range-bg {
          background-color: #111827;
        }

        .dark .calendar-container .rbc-date-cell {
          color: #f3f4f6;
        }

        .dark .calendar-container .rbc-off-range {
          color: #6b7280;
        }

        .dark .calendar-container .rbc-event {
          background-color: #3b82f6;
          border-radius: 4px;
        }

        .dark .calendar-container .rbc-event.rbc-selected {
          background-color: #2563eb;
        }

        .dark .calendar-container .rbc-agenda-view table {
          border-color: #4b5563;
        }

        .dark .calendar-container .rbc-agenda-view table tbody > tr > td {
          border-color: #4b5563;
        }

        .dark .calendar-container .rbc-agenda-date-cell,
        .dark .calendar-container .rbc-agenda-time-cell {
          color: #f3f4f6;
        }

        .dark .calendar-container .rbc-time-slot {
          border-top-color: #4b5563;
        }

        .dark .calendar-container .rbc-time-header-content {
          border-left-color: #4b5563;
        }

        .dark .calendar-container .rbc-time-content {
          border-top-color: #4b5563;
        }

        .dark .calendar-container .rbc-day-slot .rbc-time-slot {
          border-top-color: #4b5563;
        }

        /* Light mode overdue styling */
        .rbc-event-content .border-red-500 {
          background-color: #fee2e2;
        }

        /* Dark mode overdue styling */
        .dark .rbc-event-content .border-red-500 {
          background-color: #7f1d1d;
        }

        /* Event hover effect */
        .rbc-event {
          cursor: pointer;
          transition: all 0.2s;
        }

        .rbc-event:hover {
          opacity: 0.9;
          transform: scale(1.02);
        }

        /* Mobile responsive adjustments */
        @media (max-width: 640px) {
          .calendar-container .rbc-calendar {
            font-size: 12px;
          }

          .calendar-container .rbc-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .calendar-container .rbc-toolbar-label {
            margin: 8px 0;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
