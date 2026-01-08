import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Task, CreateTaskInput, CATEGORIES, User } from '../types';
import { X } from 'lucide-react';
import { usersApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: CreateTaskInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

// Helper function to parse season from JSON config
const parseSeasonFromConfig = (config: string | null | undefined): string => {
  if (!config) return '';
  try {
    const parsed = JSON.parse(config);
    return parsed.season || '';
  } catch {
    return '';
  }
};

// Helper function to convert season to JSON config
const seasonToConfig = (season: string): string => {
  if (!season) return '';
  return JSON.stringify({ season });
};

export function TaskForm({ task, onSubmit, onCancel, loading }: TaskFormProps) {
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>(
    task?.recurrence_pattern === 'seasonal' ? parseSeasonFromConfig(task?.recurrence_config) : ''
  );
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: task?.title || '',
    description: task?.description || '',
    category: task?.category || 'general',
    schedule_type: task?.schedule_type || 'once',
    due_date: task?.due_date || undefined,
    flexibility_window: task?.flexibility_window || undefined,
    recurrence_pattern: task?.recurrence_pattern || undefined,
    recurrence_interval: task?.recurrence_interval || undefined,
    recurrence_config: task?.recurrence_config || '',
    priority: task?.priority || 'medium',
    estimated_time: task?.estimated_time || undefined,
    estimated_cost: task?.estimated_cost || undefined,
    notes: task?.notes || '',
    assigned_to: task?.assigned_to || undefined,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await usersApi.getAll();
        setUsers(response.data.users);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof CreateTaskInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? t('taskForm.editTask') : t('taskForm.createNewTask')}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="label">{t('taskForm.title')} {t('taskForm.required')}</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="input"
              placeholder={t('taskForm.titlePlaceholder')}
            />
          </div>

          <div>
            <label className="label">{t('taskForm.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="input"
              rows={3}
              placeholder={t('taskForm.descriptionPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('taskForm.category')} {t('taskForm.required')}</label>
              <select
                required
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="input"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(`categories.${cat}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{t('taskForm.priority')}</label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="input"
              >
                <option value="low">{t('priorities.low')}</option>
                <option value="medium">{t('priorities.medium')}</option>
                <option value="high">{t('priorities.high')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Assign To</label>
            <select
              value={formData.assigned_to || ''}
              onChange={(e) => handleChange('assigned_to', e.target.value ? parseInt(e.target.value) : undefined)}
              className="input"
            >
              <option value="">Assign to me ({currentUser?.email})</option>
              {users.filter(u => u.id !== currentUser?.id).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Schedule Type {t('taskForm.required')}</label>
            <select
              required
              value={formData.schedule_type}
              onChange={(e) => {
                const scheduleType = e.target.value as 'once' | 'recurring';
                handleChange('schedule_type', scheduleType);
                // Clear fields that don't apply to the new schedule type
                if (scheduleType === 'once') {
                  handleChange('recurrence_pattern', undefined);
                  handleChange('recurrence_interval', undefined);
                  handleChange('recurrence_config', '');
                  setSelectedSeason('');
                } else {
                  handleChange('due_date', undefined);
                  handleChange('flexibility_window', undefined);
                }
              }}
              className="input"
            >
              <option value="once">One-time task</option>
              <option value="recurring">Recurring task</option>
            </select>
          </div>

          {formData.schedule_type === 'once' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date || ''}
                  onChange={(e) => handleChange('due_date', e.target.value || undefined)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Flexibility</label>
                <select
                  value={formData.flexibility_window || ''}
                  onChange={(e) => handleChange('flexibility_window', e.target.value || undefined)}
                  className="input"
                >
                  <option value="">Not specified</option>
                  <option value="exact_date">Must be on exact date</option>
                  <option value="within_week">Sometime this week</option>
                  <option value="within_month">Sometime this month</option>
                  <option value="within_year">Sometime this year</option>
                </select>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Recurrence Pattern {t('taskForm.required')}</label>
                  <select
                    required={formData.schedule_type === 'recurring'}
                    value={formData.recurrence_pattern || ''}
                    onChange={(e) => {
                      const pattern = e.target.value || undefined;
                      handleChange('recurrence_pattern', pattern);
                      // Clear season selection if switching away from seasonal
                      if (pattern !== 'seasonal') {
                        setSelectedSeason('');
                        handleChange('recurrence_config', '');
                      }
                    }}
                    className="input"
                  >
                    <option value="">Select pattern</option>
                    <option value="daily">{t('recurrenceTypes.daily')}</option>
                    <option value="weekly">{t('recurrenceTypes.weekly')}</option>
                    <option value="monthly">{t('recurrenceTypes.monthly')}</option>
                    <option value="yearly">{t('recurrenceTypes.yearly')}</option>
                    <option value="seasonal">{t('recurrenceTypes.seasonal')}</option>
                  </select>
                </div>

                <div>
                  <label className="label">{t('taskForm.interval')}</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.recurrence_interval || ''}
                    onChange={(e) => handleChange('recurrence_interval', parseInt(e.target.value) || undefined)}
                    className="input"
                    placeholder="1"
                  />
                </div>
              </div>

              {formData.recurrence_pattern === 'seasonal' && (
                <div>
                  <label className="label">Season {t('taskForm.required')}</label>
                  <select
                    required={formData.recurrence_pattern === 'seasonal'}
                    value={selectedSeason}
                    onChange={(e) => {
                      const season = e.target.value;
                      setSelectedSeason(season);
                      handleChange('recurrence_config', seasonToConfig(season));
                    }}
                    className="input"
                  >
                    <option value="">Select season</option>
                    <option value="spring">{t('seasons.spring')}</option>
                    <option value="summer">{t('seasons.summer')}</option>
                    <option value="fall">{t('seasons.fall')}</option>
                    <option value="winter">{t('seasons.winter')}</option>
                  </select>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('taskForm.estimatedTime')}</label>
              <input
                type="number"
                min="0"
                value={formData.estimated_time || ''}
                onChange={(e) => handleChange('estimated_time', parseInt(e.target.value) || undefined)}
                className="input"
                placeholder={t('taskForm.estimatedTimePlaceholder')}
              />
            </div>

            <div>
              <label className="label">{t('taskForm.estimatedCost')}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.estimated_cost || ''}
                onChange={(e) => handleChange('estimated_cost', parseFloat(e.target.value) || undefined)}
                className="input"
                placeholder={t('taskForm.estimatedCostPlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className="label">{t('taskForm.notes')}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="input"
              rows={3}
              placeholder={t('taskForm.notesPlaceholder')}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? t('taskForm.saving') : task ? t('taskForm.updateTask') : t('taskForm.createTask')}
            </button>
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
