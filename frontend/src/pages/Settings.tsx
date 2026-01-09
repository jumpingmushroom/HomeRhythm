import { Layout } from '../components/Layout';
import { NotificationPreferences } from '../components/NotificationPreferences';
import { useTranslation } from 'react-i18next';

export function Settings() {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('settings.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('settings.subtitle')}
          </p>
        </div>

        <NotificationPreferences />
      </div>
    </Layout>
  );
}
