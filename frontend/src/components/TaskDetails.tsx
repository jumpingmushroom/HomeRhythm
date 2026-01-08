import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Task, TaskCompletion, CATEGORY_COLORS, PRIORITY_COLORS } from '../types';
import { formatDateTime } from '../lib/utils';
import { completionsApi, photosApi } from '../lib/api';
import { X, Calendar, Clock, DollarSign, AlertCircle, CheckCircle, Edit, Trash2, User } from 'lucide-react';
import { useTasksStore } from '../store/tasksStore';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import { formatUSDAsLocalCurrency } from '../utils/currency';

interface TaskDetailsProps {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
}

export function TaskDetails({ task, onClose, onEdit, onDelete, onComplete }: TaskDetailsProps) {
  const { t } = useTranslation();
  const { userMap } = useTasksStore();
  const { user: currentUser } = useAuthStore();
  const { language } = useLanguageStore();
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const assignedUser = task.assigned_to ? userMap[task.assigned_to] : null;
  const isAssignedToOther = task.assigned_to && task.assigned_to !== currentUser?.id;

  useEffect(() => {
    loadCompletions();
  }, [task.id]);

  const loadCompletions = async () => {
    try {
      const response = await completionsApi.getForTask(task.id);
      setCompletions(response.data.completions);
    } catch (error) {
      console.error('Failed to load completions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    setSubmitting(true);
    try {
      const response = await completionsApi.create(task.id, {
        completed_at: new Date().toISOString(),
        completion_notes: completionNotes || undefined,
      });

      // Upload photos if any
      if (selectedFiles && selectedFiles.length > 0) {
        await photosApi.upload(response.data.completion.id, selectedFiles);
      }

      setShowCompleteForm(false);
      setCompletionNotes('');
      setSelectedFiles(null);
      loadCompletions();
      onComplete();
    } catch (error) {
      console.error('Failed to complete task:', error);
      alert(t('taskDetails.failedToComplete'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full border ${CATEGORY_COLORS[task.category] || CATEGORY_COLORS.general}`}>
              {t(`categories.${task.category}`)}
            </span>
            {task.priority !== 'medium' && (
              <span className={`flex items-center gap-1 text-sm ${PRIORITY_COLORS[task.priority]}`}>
                <AlertCircle className="w-4 h-4" />
                {t(`priorities.${task.priority}`)} {t('taskCard.priority')}
              </span>
            )}
          </div>

          {task.assigned_to && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-blue-900">
                <User className="w-4 h-4" />
                <span className="font-medium">
                  {isAssignedToOther
                    ? `Assigned to: ${assignedUser?.email || `User ${task.assigned_to}`}`
                    : 'Assigned to: You'
                  }
                </span>
              </div>
            </div>
          )}

          {task.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">{t('taskForm.description')}</h3>
              <p className="text-gray-900">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                {task.schedule_type === 'once' ? (
                  <>
                    One-time task
                    {task.due_date && ` - Due: ${new Date(task.due_date).toLocaleDateString()}`}
                    {task.flexibility_window && (
                      <span className="block text-xs text-gray-500 mt-1">
                        Flexibility: {task.flexibility_window.replace('within_', '').replace('_', ' ')}
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

            {task.estimated_time && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{task.estimated_time} {t('taskDetails.minutes')}</span>
              </div>
            )}

            {task.estimated_cost && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span>{formatUSDAsLocalCurrency(task.estimated_cost, language)}</span>
              </div>
            )}
          </div>

          {task.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">{t('taskForm.notes')}</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.notes}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button onClick={() => setShowCompleteForm(true)} className="btn btn-primary flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {t('taskDetails.markAsComplete')}
            </button>
            <button onClick={onEdit} className="btn btn-secondary flex items-center gap-2">
              <Edit className="w-4 h-4" />
              {t('common.edit')}
            </button>
            <button onClick={onDelete} className="btn btn-danger flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              {t('common.delete')}
            </button>
          </div>

          {showCompleteForm && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900">{t('taskDetails.completeTask')}</h3>

              <div>
                <label className="label">{t('taskDetails.completionNotes')}</label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder={t('taskDetails.completionNotesPlaceholder')}
                />
              </div>

              <div>
                <label className="label">{t('taskDetails.photos')}</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setSelectedFiles(e.target.files)}
                  className="input"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCompleteTask}
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? t('taskDetails.submitting') : t('taskDetails.submitCompletion')}
                </button>
                <button
                  onClick={() => setShowCompleteForm(false)}
                  className="btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('taskDetails.completionHistory')} ({completions.length})
            </h3>

            {loading ? (
              <p className="text-gray-500">{t('common.loading')}</p>
            ) : completions.length === 0 ? (
              <p className="text-gray-500">{t('taskDetails.noCompletions')}</p>
            ) : (
              <div className="space-y-4">
                {completions.map((completion) => (
                  <div key={completion.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDateTime(completion.completed_at)}
                      </span>
                    </div>

                    {completion.completion_notes && (
                      <p className="text-sm text-gray-600 mb-2">{completion.completion_notes}</p>
                    )}

                    {completion.photos && completion.photos.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {completion.photos.map((photo) => (
                          <img
                            key={photo.id}
                            src={photosApi.getUrl(photo.id)}
                            alt="Completion photo"
                            className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
