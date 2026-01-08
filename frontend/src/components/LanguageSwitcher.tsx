import { useLanguageStore } from '../store/languageStore';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'no' : 'en';
    setLanguage(newLanguage);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      title={language === 'en' ? 'Switch to Norwegian' : 'Bytt til engelsk'}
    >
      <Languages className="w-4 h-4" />
      <span className="font-medium">{language === 'en' ? 'NO' : 'EN'}</span>
    </button>
  );
}
