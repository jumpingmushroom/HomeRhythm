import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivityStore } from '../store/activityStore';
import { useAuthStore } from '../store/authStore';
import { activitiesApi } from '../lib/api';
import { Activity as ActivityIcon, CheckCircle, UserPlus, Edit, Trash2, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function ActivityFeed() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { activities, setActivities, setLoading } = useActivityStore();
  const [loadingState, setLoadingState] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const response = await activitiesApi.getAll(50);
      setActivities(response.data.activities);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoadingState(false);
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_created':
        return <Plus className="w-4 h-4 text-blue-600" />;
      case 'task_completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'task_assigned':
        return <UserPlus className="w-4 h-4 text-purple-600" />;
      case 'task_updated':
        return <Edit className="w-4 h-4 text-orange-600" />;
      case 'task_deleted':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityText = (activity: any) => {
    const isCurrentUser = activity.user_id === user?.id;
    const userName = isCurrentUser ? t('activities.you') : activity.user_email.split('@')[0];

    switch (activity.activity_type) {
      case 'task_created':
        return `${userName} ${t('activities.created')} "${activity.task_title}"`;
      case 'task_completed':
        return `${userName} ${t('activities.completed')} "${activity.task_title}"`;
      case 'task_assigned':
        const assignedTo = activity.parsed_metadata?.assigned_to_email?.split('@')[0];
        return `${userName} ${t('activities.assigned')} "${activity.task_title}" ${t('activities.to')} ${assignedTo}`;
      case 'task_updated':
        return `${userName} ${t('activities.updated')} "${activity.task_title}"`;
      case 'task_deleted':
        return `${userName} ${t('activities.deleted')} "${activity.task_title}"`;
      default:
        return `${userName} performed an action`;
    }
  };

  if (loadingState) {
    return <div className="card">{t('activities.loadingActivities')}</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="card text-center py-8">
        <ActivityIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 dark:text-gray-400">{t('activities.noActivities')}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {t('activities.noActivitiesDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <ActivityIcon className="w-5 h-5" />
        {t('activities.title')}
      </h2>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="mt-1">
              {getActivityIcon(activity.activity_type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {getActivityText(activity)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
              {activity.parsed_metadata?.completion_notes && (
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 italic">
                  "{activity.parsed_metadata.completion_notes}"
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
