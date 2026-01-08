import { useTranslation } from 'react-i18next';
import { Task, CATEGORY_COLORS, PRIORITY_COLORS } from '../types';
import { formatDate } from '../lib/utils';
import { Calendar, Clock, DollarSign, AlertCircle, User } from 'lucide-react';
import { useTasksStore } from '../store/tasksStore';
import { useAuthStore } from '../store/authStore';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  lastCompleted?: string;
}

export function TaskCard({ task, onClick, lastCompleted }: TaskCardProps) {
  const { t } = useTranslation();
  const { userMap } = useTasksStore();
  const { user: currentUser } = useAuthStore();
  const assignedUser = task.assigned_to ? userMap[task.assigned_to] : null;
  const isAssignedToOther = task.assigned_to && task.assigned_to !== currentUser?.id;

  return (
    <div
      onClick={onClick}
      className="card hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${CATEGORY_COLORS[task.category] || CATEGORY_COLORS.general}`}>
          {t(`categories.${task.category}`)}
        </span>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      {isAssignedToOther && (
        <div className="mb-3 flex items-center gap-1 text-sm text-blue-600">
          <User className="w-4 h-4" />
          <span>Assigned to: {assignedUser?.email || `User ${task.assigned_to}`}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>
            {task.schedule_type === 'once' ? (
              <>
                One-time
                {task.due_date && ` - ${formatDate(task.due_date)}`}
                {task.flexibility_window && task.flexibility_window !== 'exact_date' && (
                  <span className="text-xs text-gray-500">
                    {' '}({task.flexibility_window.replace('within_', '').replace('_', ' ')})
                  </span>
                )}
              </>
            ) : (
              <>
                {task.recurrence_pattern && t(`recurrenceTypes.${task.recurrence_pattern}`)}
                {task.recurrence_interval && ` (${t('taskCard.every')} ${task.recurrence_interval})`}
              </>
            )}
          </span>
        </div>

        {task.priority !== 'medium' && (
          <div className={`flex items-center gap-1 ${PRIORITY_COLORS[task.priority]}`}>
            <AlertCircle className="w-4 h-4" />
            <span>{t(`priorities.${task.priority}`)} {t('taskCard.priority')}</span>
          </div>
        )}

        {task.estimated_time && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{task.estimated_time} {t('taskCard.min')}</span>
          </div>
        )}

        {task.estimated_cost && (
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span>${task.estimated_cost}</span>
          </div>
        )}
      </div>

      {lastCompleted && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-500">
          {t('taskCard.lastCompleted')}: {formatDate(lastCompleted)}
        </div>
      )}
    </div>
  );
}
