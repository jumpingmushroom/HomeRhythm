import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../components/Layout';
import { TaskCard } from '../components/TaskCard';
import { TaskForm } from '../components/TaskForm';
import { TaskDetails } from '../components/TaskDetails';
import { TemplateLibrary } from '../components/TemplateLibrary';
import { useTasksStore } from '../store/tasksStore';
import { tasksApi, completionsApi, usersApi } from '../lib/api';
import { Task, CreateTaskInput, TaskTemplate, CATEGORIES } from '../types';
import { Plus, Search, BookOpen, List, Calendar as CalendarIcon } from 'lucide-react';

export function Dashboard() {
  const { t } = useTranslation();
  const { tasks, setTasks, addTask, updateTask, deleteTask, filters, setFilters, setUser } = useTasksStore();
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastCompletions, setLastCompletions] = useState<Record<number, string>>({});
  const [view, setView] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    loadTasks();
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      const response = await usersApi.getAll();
      response.data.users.forEach(user => setUser(user));
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const params: any = {};
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;

      const response = await tasksApi.getAll(params);
      setTasks(response.data.tasks);

      // Load last completions for each task
      const completionsMap: Record<number, string> = {};
      await Promise.all(
        response.data.tasks.map(async (task) => {
          try {
            const comp = await completionsApi.getLastForTask(task.id);
            completionsMap[task.id] = comp.data.completion.completed_at;
          } catch {
            // No completions yet
          }
        })
      );
      setLastCompletions(completionsMap);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (data: CreateTaskInput) => {
    setSubmitting(true);
    try {
      const response = await tasksApi.create(data);
      addTask(response.data.task);
      setShowTaskForm(false);
      setEditingTask(undefined);
    } catch (error: any) {
      console.error('Failed to create task:', error);
      alert(error.response?.data?.error || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTask = async (data: CreateTaskInput) => {
    if (!editingTask) return;

    setSubmitting(true);
    try {
      const response = await tasksApi.update(editingTask.id, data);
      updateTask(response.data.task);
      setShowTaskForm(false);
      setEditingTask(undefined);
      if (selectedTask?.id === editingTask.id) {
        setSelectedTask(response.data.task);
      }
    } catch (error: any) {
      console.error('Failed to update task:', error);
      alert(error.response?.data?.error || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm(t('taskDetails.deleteConfirm'))) return;

    try {
      await tasksApi.delete(task.id);
      deleteTask(task.id);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert(t('taskDetails.failedToDelete'));
    }
  };

  const handleSelectTemplate = async (template: TaskTemplate) => {
    setShowTemplates(false);
    setSubmitting(true);

    try {
      // Create task directly from template data
      const taskData: CreateTaskInput = {
        title: template.title,
        description: template.description || '',
        category: template.category,
        schedule_type: 'recurring',
        recurrence_pattern: template.suggested_recurrence_pattern as any,
        recurrence_interval: template.suggested_recurrence_interval || undefined,
        recurrence_config: template.suggested_recurrence_config || '',
        priority: 'medium',
      };

      const response = await tasksApi.create(taskData);
      addTask(response.data.task);
    } catch (error: any) {
      console.error('Failed to create task from template:', error);
      alert(error.response?.data?.error || 'Failed to create task from template');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = tasks;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
            <p className="text-gray-600 mt-1">{t('dashboard.subtitle')}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowTemplates(true)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              {t('dashboard.browseTemplates')}
            </button>
            <button
              onClick={() => {
                setEditingTask(undefined);
                setShowTaskForm(true);
              }}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('dashboard.newTask')}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('dashboard.searchPlaceholder')}
                  value={filters.search}
                  onChange={(e) => setFilters({ search: e.target.value })}
                  className="input pl-10"
                />
              </div>
            </div>

            <select
              value={filters.category || ''}
              onChange={(e) => setFilters({ category: e.target.value || null })}
              className="input sm:w-48"
            >
              <option value="">{t('dashboard.allCategories')}</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`categories.${cat}`)}
                </option>
              ))}
            </select>

            <select
              value={filters.priority || ''}
              onChange={(e) => setFilters({ priority: e.target.value || null })}
              className="input sm:w-48"
            >
              <option value="">{t('dashboard.allPriorities')}</option>
              <option value="low">{t('priorities.low')}</option>
              <option value="medium">{t('priorities.medium')}</option>
              <option value="high">{t('priorities.high')}</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg ${
                  view === 'list' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`p-2 rounded-lg ${
                  view === 'calendar' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <CalendarIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">{t('dashboard.loadingTasks')}</div>
        ) : filteredTasks.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">{t('dashboard.noTasksFound')}</p>
            <button
              onClick={() => setShowTemplates(true)}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              {t('dashboard.browseTaskTemplates')}
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => setSelectedTask(task)}
                lastCompleted={lastCompletions[task.id]}
              />
            ))}
          </div>
        )}
      </div>

      {showTaskForm && (
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onCancel={() => {
            setShowTaskForm(false);
            setEditingTask(undefined);
          }}
          loading={submitting}
        />
      )}

      {showTemplates && (
        <TemplateLibrary
          onClose={() => setShowTemplates(false)}
          onSelectTemplate={handleSelectTemplate}
        />
      )}

      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={() => {
            setEditingTask(selectedTask);
            setShowTaskForm(true);
            setSelectedTask(null);
          }}
          onDelete={() => handleDeleteTask(selectedTask)}
          onComplete={() => {
            loadTasks();
          }}
        />
      )}
    </Layout>
  );
}
