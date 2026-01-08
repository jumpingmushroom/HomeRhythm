import { useState, useEffect } from 'react';
import { TaskTemplate, CATEGORY_COLORS } from '../types';
import { templatesApi } from '../lib/api';
import { X, BookOpen } from 'lucide-react';
import { capitalizeFirst } from '../lib/utils';

interface TemplateLibraryProps {
  onClose: () => void;
  onSelectTemplate: (template: TaskTemplate) => void;
}

export function TemplateLibrary({ onClose, onSelectTemplate }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<Record<string, TaskTemplate[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await templatesApi.getByCategory();
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = Object.keys(templates);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Task Template Library</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <p className="text-center text-gray-500">Loading templates...</p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === null
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {capitalizeFirst(category)} ({templates[category].length})
                  </button>
                ))}
              </div>

              <div className="grid gap-4">
                {categories
                  .filter((cat) => !selectedCategory || cat === selectedCategory)
                  .map((category) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {capitalizeFirst(category)}
                      </h3>
                      <div className="grid gap-3">
                        {templates[category].map((template) => (
                          <div
                            key={template.id}
                            onClick={() => onSelectTemplate(template)}
                            className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 cursor-pointer transition-colors border border-gray-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">
                                  {template.title}
                                </h4>
                                {template.description && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {template.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span className={`px-2 py-1 rounded-full border ${CATEGORY_COLORS[template.category]}`}>
                                    {capitalizeFirst(template.category)}
                                  </span>
                                  <span>
                                    {capitalizeFirst(template.suggested_recurrence_type)}
                                    {template.suggested_recurrence_interval &&
                                      ` (every ${template.suggested_recurrence_interval})`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
