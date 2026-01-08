import { useState } from 'react';
import { Task, CreateTaskInput, CATEGORIES } from '../types';
import { X } from 'lucide-react';

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: CreateTaskInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function TaskForm({ task, onSubmit, onCancel, loading }: TaskFormProps) {
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: task?.title || '',
    description: task?.description || '',
    category: task?.category || 'general',
    recurrence_type: task?.recurrence_type || 'once',
    recurrence_interval: task?.recurrence_interval || undefined,
    recurrence_config: task?.recurrence_config || '',
    priority: task?.priority || 'medium',
    estimated_time: task?.estimated_time || undefined,
    estimated_cost: task?.estimated_cost || undefined,
    notes: task?.notes || '',
  });

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
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="label">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="input"
              placeholder="Clean gutters"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="input"
              rows={3}
              placeholder="Remove leaves and debris from gutters and downspouts"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="input"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Recurrence Type *</label>
              <select
                required
                value={formData.recurrence_type}
                onChange={(e) => handleChange('recurrence_type', e.target.value)}
                className="input"
              >
                <option value="once">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="seasonal">Seasonal</option>
              </select>
            </div>

            {formData.recurrence_type !== 'once' && (
              <div>
                <label className="label">Interval</label>
                <input
                  type="number"
                  min="1"
                  value={formData.recurrence_interval || ''}
                  onChange={(e) => handleChange('recurrence_interval', parseInt(e.target.value) || undefined)}
                  className="input"
                  placeholder="1"
                />
              </div>
            )}
          </div>

          {formData.recurrence_type === 'seasonal' && (
            <div>
              <label className="label">Season Config (JSON)</label>
              <input
                type="text"
                value={formData.recurrence_config}
                onChange={(e) => handleChange('recurrence_config', e.target.value)}
                className="input"
                placeholder='{"season": "spring"}'
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Estimated Time (minutes)</label>
              <input
                type="number"
                min="0"
                value={formData.estimated_time || ''}
                onChange={(e) => handleChange('estimated_time', parseInt(e.target.value) || undefined)}
                className="input"
                placeholder="60"
              />
            </div>

            <div>
              <label className="label">Estimated Cost ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.estimated_cost || ''}
                onChange={(e) => handleChange('estimated_cost', parseFloat(e.target.value) || undefined)}
                className="input"
                placeholder="50.00"
              />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="input"
              rows={3}
              placeholder="Additional notes or instructions"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
