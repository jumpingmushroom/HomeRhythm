import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { notificationPreferencesApi } from '../lib/api';
import { NotificationPreferences as NotificationPreferencesType } from '../types';

export function NotificationPreferences() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<NotificationPreferencesType | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchPreferences = async () => {
    try {
      setLoadingPreferences(true);
      const response = await notificationPreferencesApi.get();
      setFormData(response.data.preferences);
    } catch (err: any) {
      setError(err.response?.data?.error || t('settings.failedToLoadPreferences'));
    } finally {
      setLoadingPreferences(false);
    }
  };

  const handleChange = (field: keyof NotificationPreferencesType, value: any) => {
    if (formData) {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await notificationPreferencesApi.update({
        notifications_enabled: formData.notifications_enabled,
        task_due_soon_days: formData.task_due_soon_days,
        task_due_soon_enabled: formData.task_due_soon_enabled,
        task_overdue_enabled: formData.task_overdue_enabled,
        task_assigned_enabled: formData.task_assigned_enabled,
        digest_enabled: formData.digest_enabled,
        digest_frequency: formData.digest_frequency,
        digest_time: formData.digest_time,
        digest_day_of_week: formData.digest_day_of_week,
      });
      setFormData(response.data.preferences);
      setSuccess(t('settings.preferencesSaved'));
    } catch (err: any) {
      setError(err.response?.data?.error || t('settings.failedToSavePreferences'));
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setError('');
    setSuccess('');
    setSendingTestEmail(true);

    try {
      await notificationPreferencesApi.sendTestEmail();
      setSuccess(t('settings.testEmailSent'));
    } catch (err: any) {
      setError(err.response?.data?.error || t('settings.failedToSendTestEmail'));
    } finally {
      setSendingTestEmail(false);
    }
  };

  const getDayName = (dayNumber: number): string => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return t(`settings.${days[dayNumber - 1]}`);
  };

  if (loadingPreferences) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">{t('common.loading')}</div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
        {error || t('settings.failedToLoadPreferences')}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Master toggle */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('settings.notifications')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('settings.notificationsDescription')}
            </p>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
              checked={formData.notifications_enabled === 1}
              onChange={(e) => handleChange('notifications_enabled', e.target.checked ? 1 : 0)}
            />
          </label>
        </div>
      </div>

      {/* Task notifications section */}
      {formData.notifications_enabled === 1 && (
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('settings.taskNotifications')}
          </h3>

          {/* Due soon toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              {t('settings.dueSoonNotifications')}
            </label>
            <input
              type="checkbox"
              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
              checked={formData.task_due_soon_enabled === 1}
              onChange={(e) => handleChange('task_due_soon_enabled', e.target.checked ? 1 : 0)}
            />
          </div>

          {/* Days before due - only shown if due soon enabled */}
          {formData.task_due_soon_enabled === 1 && (
            <div>
              <label htmlFor="task_due_soon_days" className="label">
                {t('settings.dueSoonDays')}
              </label>
              <input
                id="task_due_soon_days"
                type="number"
                min="1"
                max="30"
                className="input"
                value={formData.task_due_soon_days}
                onChange={(e) => handleChange('task_due_soon_days', parseInt(e.target.value, 10))}
              />
            </div>
          )}

          {/* Overdue toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              {t('settings.overdueNotifications')}
            </label>
            <input
              type="checkbox"
              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
              checked={formData.task_overdue_enabled === 1}
              onChange={(e) => handleChange('task_overdue_enabled', e.target.checked ? 1 : 0)}
            />
          </div>

          {/* Assigned toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              {t('settings.assignedNotifications')}
            </label>
            <input
              type="checkbox"
              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
              checked={formData.task_assigned_enabled === 1}
              onChange={(e) => handleChange('task_assigned_enabled', e.target.checked ? 1 : 0)}
            />
          </div>
        </div>
      )}

      {/* Digest section */}
      {formData.notifications_enabled === 1 && (
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('settings.digestNotifications')}
          </h3>

          {/* Enable digest toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              {t('settings.enableDigest')}
            </label>
            <input
              type="checkbox"
              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
              checked={formData.digest_enabled === 1}
              onChange={(e) => handleChange('digest_enabled', e.target.checked ? 1 : 0)}
            />
          </div>

          {/* Digest settings - only shown if digest enabled */}
          {formData.digest_enabled === 1 && (
            <>
              {/* Digest frequency */}
              <div>
                <label htmlFor="digest_frequency" className="label">
                  {t('settings.digestFrequency')}
                </label>
                <select
                  id="digest_frequency"
                  className="input"
                  value={formData.digest_frequency}
                  onChange={(e) => handleChange('digest_frequency', e.target.value as 'daily' | 'weekly')}
                >
                  <option value="daily">{t('settings.daily')}</option>
                  <option value="weekly">{t('settings.weekly')}</option>
                </select>
              </div>

              {/* Digest time */}
              <div>
                <label htmlFor="digest_time" className="label">
                  {t('settings.digestTime')}
                </label>
                <input
                  id="digest_time"
                  type="time"
                  className="input"
                  value={formData.digest_time}
                  onChange={(e) => handleChange('digest_time', e.target.value)}
                />
              </div>

              {/* Digest day of week - only shown if weekly */}
              {formData.digest_frequency === 'weekly' && (
                <div>
                  <label htmlFor="digest_day_of_week" className="label">
                    {t('settings.digestDayOfWeek')}
                  </label>
                  <select
                    id="digest_day_of_week"
                    className="input"
                    value={formData.digest_day_of_week}
                    onChange={(e) => handleChange('digest_day_of_week', parseInt(e.target.value, 10))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <option key={day} value={day}>
                        {getDayName(day)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? t('settings.savingPreferences') : t('settings.savePreferences')}
        </button>
        <button
          type="button"
          onClick={handleTestEmail}
          disabled={sendingTestEmail}
          className="btn btn-secondary"
        >
          {sendingTestEmail ? t('common.loading') : t('settings.testEmail')}
        </button>
      </div>

      {/* Test email description */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('settings.testEmailDescription')}
      </p>
    </form>
  );
}
