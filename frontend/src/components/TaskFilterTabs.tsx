import { useTasksStore } from '../store/tasksStore';
import { List, User, UserX } from 'lucide-react';

export function TaskFilterTabs() {
  const { filters, setFilters } = useTasksStore();
  const { assignmentFilter } = filters;

  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      <button
        onClick={() => setFilters({ assignmentFilter: 'all' })}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          assignmentFilter === 'all'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        <List className="w-4 h-4" />
        All Tasks
      </button>
      <button
        onClick={() => setFilters({ assignmentFilter: 'created' })}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          assignmentFilter === 'created'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        <User className="w-4 h-4" />
        Created by Me
      </button>
      <button
        onClick={() => setFilters({ assignmentFilter: 'assigned' })}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          assignmentFilter === 'assigned'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        <User className="w-4 h-4" />
        Assigned to Me
      </button>
      <button
        onClick={() => setFilters({ assignmentFilter: 'unassigned' })}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          assignmentFilter === 'unassigned'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        <UserX className="w-4 h-4" />
        Unassigned
      </button>
    </div>
  );
}
