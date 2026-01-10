import { useState, useEffect } from 'react';
import { useTasksStore } from '../store/tasksStore';
import { subtasksApi } from '../lib/api';
import { TaskSubtask } from '../types';

interface SubtasksListProps {
  taskId: number;
}

export default function SubtasksList({ taskId }: SubtasksListProps) {
  const { subtasks, setSubtasks, addSubtask, updateSubtask, deleteSubtask } = useTasksStore();
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const taskSubtasks = subtasks[taskId] || [];

  useEffect(() => {
    loadSubtasks();
  }, [taskId]);

  const loadSubtasks = async () => {
    try {
      setLoading(true);
      const response = await subtasksApi.getForTask(taskId);
      setSubtasks(taskId, response.data.subtasks);
    } catch (error) {
      console.error('Failed to load subtasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskText.trim()) return;

    try {
      setIsAdding(true);
      const response = await subtasksApi.create(taskId, {
        text: newSubtaskText.trim(),
        completed: 0,
      });
      addSubtask(response.data.subtask);
      setNewSubtaskText('');
    } catch (error) {
      console.error('Failed to add subtask:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleComplete = async (subtask: TaskSubtask) => {
    try {
      const newCompleted = subtask.completed === 1 ? 0 : 1;
      const response = await subtasksApi.update(subtask.id, {
        completed: newCompleted,
      });
      updateSubtask(response.data.subtask);
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
    }
  };

  const handleDelete = async (subtask: TaskSubtask) => {
    if (!confirm('Are you sure you want to delete this subtask?')) return;

    try {
      await subtasksApi.delete(subtask.id);
      deleteSubtask(taskId, subtask.id);
    } catch (error) {
      console.error('Failed to delete subtask:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Subtasks</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const completedCount = taskSubtasks.filter((s) => s.completed === 1).length;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Subtasks</h3>
        {taskSubtasks.length > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completedCount} / {taskSubtasks.length} completed
          </span>
        )}
      </div>

      {/* Subtasks list */}
      <div className="space-y-2">
        {taskSubtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <input
              type="checkbox"
              checked={subtask.completed === 1}
              onChange={() => handleToggleComplete(subtask)}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <span
              className={`flex-1 text-sm ${
                subtask.completed === 1
                  ? 'line-through text-gray-500 dark:text-gray-400'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {subtask.text}
            </span>
            <button
              onClick={() => handleDelete(subtask)}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
            >
              Delete
            </button>
          </div>
        ))}

        {taskSubtasks.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No subtasks yet</p>
        )}
      </div>

      {/* Add new subtask */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newSubtaskText}
          onChange={(e) => setNewSubtaskText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddSubtask();
            }
          }}
          placeholder="Add a subtask..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
          disabled={isAdding}
        />
        <button
          onClick={handleAddSubtask}
          disabled={isAdding || !newSubtaskText.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
        >
          {isAdding ? 'Adding...' : 'Add'}
        </button>
      </div>
    </div>
  );
}
