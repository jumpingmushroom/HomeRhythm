import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TaskTemplate, CATEGORY_COLORS } from '../types';
import { templatesApi } from '../lib/api';
import { X, BookOpen } from 'lucide-react';

interface TemplateLibraryProps {
  onClose: () => void;
  onSelectTemplate: (template: TaskTemplate) => void;
}

// Helper function to convert template title to translation key
function getTitleKey(title: string): string {
  return title
    .split(' ')
    .map((word, index) => {
      const cleaned = word.replace(/[^a-zA-Z]/g, '');
      return index === 0 ? cleaned.charAt(0).toLowerCase() + cleaned.slice(1) : cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    })
    .join('');
}

export function TemplateLibrary({ onClose, onSelectTemplate }: TemplateLibraryProps) {
  const { t } = useTranslation();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('templateLibrary.title')}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400">{t('templateLibrary.loadingTemplates')}</p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === null
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {t('common.all')}
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t(`categories.${category}`)} ({templates[category].length})
                  </button>
                ))}
              </div>

              <div className="grid gap-4">
                {categories
                  .filter((cat) => !selectedCategory || cat === selectedCategory)
                  .map((category) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        {t(`categories.${category}`)}
                      </h3>
                      <div className="grid gap-3">
                        {templates[category].map((template) => {
                          const titleKey = getTitleKey(template.title);
                          const translatedTitle = t(`templates.${titleKey}.title`, { defaultValue: template.title });
                          const translatedDescription = template.description
                            ? t(`templates.${titleKey}.description`, { defaultValue: template.description })
                            : '';

                          // Create a translated copy of the template to pass to the handler
                          const translatedTemplate = {
                            ...template,
                            title: translatedTitle,
                            description: translatedDescription
                          };

                          return (
                            <div
                              key={template.id}
                              onClick={() => onSelectTemplate(translatedTemplate)}
                              className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-4 cursor-pointer transition-colors border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                                    {translatedTitle}
                                  </h4>
                                  {translatedDescription && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                      {translatedDescription}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span className={`px-2 py-1 rounded-full border ${CATEGORY_COLORS[template.category]}`}>
                                      {t(`categories.${template.category}`)}
                                    </span>
                                    <span>
                                      {t(`recurrenceTypes.${template.suggested_recurrence_pattern}`)}
                                      {template.suggested_recurrence_interval &&
                                        ` (${t('taskCard.every')} ${template.suggested_recurrence_interval})`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
