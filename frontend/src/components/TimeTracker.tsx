import { useState, useEffect } from 'react';
import { useTasksStore } from '../store/tasksStore';
import { timeTrackingApi } from '../lib/api';

interface TimeTrackerProps {
  taskId: number;
}

export default function TimeTracker({ taskId }: TimeTrackerProps) {
  const { timeEntries, activeTimer, setTimeEntries, setActiveTimer, addTimeEntry, updateTimeEntry, deleteTimeEntry } = useTasksStore();
  const [stopNotes, setStopNotes] = useState('');
  const [showStopForm, setShowStopForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const taskEntries = timeEntries[taskId] || [];
  const isActiveOnThisTask = activeTimer?.task_id === taskId;

  useEffect(() => {
    loadTimeEntries();
    loadActiveTimer();
  }, [taskId]);

  // Update elapsed time every second when timer is active
  useEffect(() => {
    if (!activeTimer || activeTimer.task_id !== taskId) {
      setElapsedTime(0);
      return;
    }

    const updateElapsed = () => {
      const start = new Date(activeTimer.started_at).getTime();
      const now = Date.now();
      setElapsedTime(Math.floor((now - start) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [activeTimer, taskId]);

  const loadTimeEntries = async () => {
    try {
      const response = await timeTrackingApi.getForTask(taskId);
      setTimeEntries(taskId, response.data.entries);
    } catch (error) {
      console.error('Failed to load time entries:', error);
    }
  };

  const loadActiveTimer = async () => {
    try {
      const response = await timeTrackingApi.getActive();
      setActiveTimer(response.data.entry);
    } catch (error) {
      console.error('Failed to load active timer:', error);
    }
  };

  const handleStart = async () => {
    try {
      setLoading(true);
      const response = await timeTrackingApi.start(taskId);
      setActiveTimer(response.data.entry);
      addTimeEntry(response.data.entry);
    } catch (error: any) {
      console.error('Failed to start timer:', error);
      if (error.response?.data?.active_task_title) {
        alert(`You already have a timer running on "${error.response.data.active_task_title}". Please stop it first.`);
      } else {
        alert('Failed to start timer. ' + (error.response?.data?.error || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!activeTimer) return;

    try {
      setLoading(true);
      const response = await timeTrackingApi.stop(activeTimer.id, {
        notes: stopNotes.trim() || undefined,
      });
      updateTimeEntry(response.data.entry);
      setActiveTimer(null);
      setShowStopForm(false);
      setStopNotes('');
    } catch (error) {
      console.error('Failed to stop timer:', error);
      alert('Failed to stop timer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entryId: number) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return;

    try {
      await timeTrackingApi.delete(entryId);
      deleteTimeEntry(taskId, entryId);
    } catch (error) {
      console.error('Failed to delete time entry:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const totalDuration = taskEntries
    .filter((e) => e.ended_at !== null)
    .reduce((sum, e) => sum + (e.duration || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Time Tracking</h3>
        {totalDuration > 0 && (
          <span className="text-sm text-gray-500">
            Total: {formatDuration(totalDuration)}
          </span>
        )}
      </div>

      {/* Active timer */}
      {isActiveOnThisTask && activeTimer ? (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blue-900">Timer Running</span>
            <span className="text-2xl font-mono text-blue-900">
              {formatDuration(elapsedTime)}
            </span>
          </div>

          {!showStopForm ? (
            <button
              onClick={() => setShowStopForm(true)}
              disabled={loading}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 text-sm"
            >
              Stop Timer
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={stopNotes}
                onChange={(e) => setStopNotes(e.target.value)}
                placeholder="Add notes (optional)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleStop}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 text-sm"
                >
                  {loading ? 'Stopping...' : 'Confirm Stop'}
                </button>
                <button
                  onClick={() => {
                    setShowStopForm(false);
                    setStopNotes('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={handleStart}
          disabled={loading || !!activeTimer}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
        >
          {loading ? 'Starting...' : activeTimer ? 'Timer running on another task' : 'Start Timer'}
        </button>
      )}

      {/* Time entries history */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">History</h4>
        {taskEntries.filter((e) => e.ended_at !== null).length === 0 ? (
          <p className="text-sm text-gray-500 italic">No time entries yet</p>
        ) : (
          <div className="space-y-2">
            {taskEntries
              .filter((e) => e.ended_at !== null)
              .map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDuration(entry.duration || 0)}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatDate(entry.started_at)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                  {entry.notes && (
                    <p className="text-xs text-gray-600 mt-1">{entry.notes}</p>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
