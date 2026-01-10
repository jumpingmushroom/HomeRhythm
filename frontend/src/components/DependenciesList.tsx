import { useState, useEffect } from 'react';
import { useTasksStore } from '../store/tasksStore';
import { dependenciesApi, tasksApi } from '../lib/api';
import { Task } from '../types';

interface DependenciesListProps {
  taskId: number;
}

export default function DependenciesList({ taskId }: DependenciesListProps) {
  const { dependencies, setDependencies, addDependency, removeDependency } = useTasksStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const taskDependencies = dependencies[taskId] || [];

  useEffect(() => {
    loadDependencies();
  }, [taskId]);

  useEffect(() => {
    if (showAddForm) {
      loadAvailableTasks();
    }
  }, [showAddForm]);

  const loadDependencies = async () => {
    try {
      setLoading(true);
      const response = await dependenciesApi.getForTask(taskId);
      setDependencies(taskId, response.data.dependencies);
    } catch (error) {
      console.error('Failed to load dependencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTasks = async () => {
    try {
      const response = await tasksApi.getAll();
      // Filter out current task and already dependent tasks
      const dependentTaskIds = taskDependencies.map((d) => d.depends_on_task_id);
      const available = response.data.tasks.filter(
        (t) => t.id !== taskId && !dependentTaskIds.includes(t.id)
      );
      setAvailableTasks(available);
    } catch (error) {
      console.error('Failed to load available tasks:', error);
    }
  };

  const handleAdd = async () => {
    if (!selectedTaskId) return;

    try {
      setIsAdding(true);
      const response = await dependenciesApi.create({
        task_id: taskId,
        depends_on_task_id: selectedTaskId,
      });
      addDependency(response.data.dependency);
      setShowAddForm(false);
      setSelectedTaskId(null);
    } catch (error: any) {
      console.error('Failed to add dependency:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Failed to add dependency');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (dependencyId: number) => {
    if (!confirm('Are you sure you want to remove this dependency?')) return;

    try {
      await dependenciesApi.delete(dependencyId);
      removeDependency(taskId, dependencyId);
    } catch (error) {
      console.error('Failed to remove dependency:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900">Dependencies</h3>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  const completedCount = taskDependencies.filter((d) => d.depends_on_task_completed).length;
  const hasBlocking = taskDependencies.some((d) => !d.depends_on_task_completed);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Dependencies</h3>
        {taskDependencies.length > 0 && (
          <span className="text-sm text-gray-500">
            {completedCount} / {taskDependencies.length} completed
          </span>
        )}
      </div>

      {hasBlocking && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            ⚠️ This task cannot be completed until all dependencies are done
          </p>
        </div>
      )}

      {/* Dependencies list */}
      <div className="space-y-2">
        {taskDependencies.map((dependency) => (
          <div
            key={dependency.id}
            className="flex items-center gap-2 p-3 border border-gray-200 rounded-md hover:bg-gray-50"
          >
            <span className="text-lg">
              {dependency.depends_on_task_completed ? '✅' : '⏳'}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {dependency.depends_on_task_title}
              </p>
              <p className="text-xs text-gray-500">
                {dependency.depends_on_task_completed ? 'Completed' : 'Pending'}
              </p>
            </div>
            <button
              onClick={() => handleRemove(dependency.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          </div>
        ))}

        {taskDependencies.length === 0 && (
          <p className="text-sm text-gray-500 italic">No dependencies</p>
        )}
      </div>

      {/* Add dependency */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
        >
          Add Dependency
        </button>
      ) : (
        <div className="space-y-2 p-3 border border-gray-300 rounded-md bg-gray-50">
          <label className="block text-sm font-medium text-gray-700">
            Depends on task:
          </label>
          <select
            value={selectedTaskId || ''}
            onChange={(e) => setSelectedTaskId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Select a task...</option>
            {availableTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={isAdding || !selectedTaskId}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
            >
              {isAdding ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setSelectedTaskId(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
