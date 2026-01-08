import { useLanguageStore } from '../store/languageStore';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { currentLanguage, setLanguage } = useLanguageStore();

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'en' ? 'no' : 'en';
    setLanguage(newLanguage);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      title={currentLanguage === 'en' ? 'Switch to Norwegian' : 'Bytt til engelsk'}
    >
      <Languages className="w-4 h-4" />
      <span className="font-medium">{currentLanguage === 'en' ? 'NO' : 'EN'}</span>
    </button>
  );
}
