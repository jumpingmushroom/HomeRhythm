import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { backupApi } from '../lib/api';
import { Download, Database, Trash2, AlertCircle } from 'lucide-react';

interface BackupFile {
  filename: string;
  size: number;
  created: string;
}

interface BackupStatus {
  enabled: boolean;
  lastBackup?: string;
  lastBackupFilename?: string;
  backupCount: number;
  totalSize: number;
  backupDirectory: string;
  intervalHours: number;
}

export function BackupSettings() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStatus();
    fetchBackups();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchStatus = async () => {
    try {
      const response = await backupApi.getStatus();
      setStatus(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || t('settings.backup.failedToLoadStatus'));
    } finally {
      setLoading(false);
    }
  };

  const fetchBackups = async () => {
    try {
      const response = await backupApi.list();
      setBackups(response.data.backups);
    } catch (err: any) {
      console.error('Failed to fetch backups:', err);
    }
  };

  const handleCreateBackup = async () => {
    setError('');
    setSuccess('');
    setCreatingBackup(true);

    try {
      const response = await backupApi.create();
      setSuccess(t('settings.backup.backupCreated', { filename: response.data.filename }));
      await fetchStatus();
      await fetchBackups();
    } catch (err: any) {
      setError(err.response?.data?.error || t('settings.backup.failedToCreateBackup'));
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownload = (filename: string) => {
    backupApi.download(filename);
  };

  const handleDownloadCurrent = () => {
    backupApi.downloadCurrent();
  };

  const handleCleanup = async () => {
    if (!confirm(t('settings.backup.confirmCleanup'))) {
      return;
    }

    setError('');
    setSuccess('');
    setCleaningUp(true);

    try {
      const response = await backupApi.cleanup();
      setSuccess(t('settings.backup.cleanupCompleted', { deleted: response.data.deleted }));
      await fetchStatus();
      await fetchBackups();
    } catch (err: any) {
      setError(err.response?.data?.error || t('settings.backup.failedToCleanup'));
    } finally {
      setCleaningUp(false);
    }
  };

  const formatSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">{t('common.loading')}</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
        {error || t('settings.backup.failedToLoadStatus')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Backup Status */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t('settings.backup.title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('settings.backup.description')}
            </p>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-400">{t('settings.backup.status')}:</span>
                <span className={`font-medium ${status.enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {status.enabled ? t('settings.backup.enabled') : t('settings.backup.disabled')}
                </span>
              </div>

              {status.enabled && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">{t('settings.backup.interval')}:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {t('settings.backup.everyNHours', { hours: status.intervalHours })}
                    </span>
                  </div>

                  {status.lastBackup && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">{t('settings.backup.lastBackup')}:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(status.lastBackup)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">{t('settings.backup.totalBackups')}:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {status.backupCount} ({formatSize(status.totalSize)})
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backup Actions */}
      {status.enabled && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('settings.backup.actions')}
          </h3>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="btn btn-primary flex items-center justify-center gap-2"
            >
              <Database className="h-4 w-4" />
              {creatingBackup ? t('settings.backup.creatingBackup') : t('settings.backup.createBackup')}
            </button>

            <button
              onClick={handleDownloadCurrent}
              className="btn btn-secondary flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t('settings.backup.downloadCurrent')}
            </button>

            <button
              onClick={handleCleanup}
              disabled={cleaningUp}
              className="btn btn-secondary flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {cleaningUp ? t('common.loading') : t('settings.backup.cleanup')}
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
            {t('settings.backup.actionsDescription')}
          </p>
        </div>
      )}

      {/* Backup List */}
      {status.enabled && backups.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('settings.backup.backupList')} ({backups.length})
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {backups.map((backup) => (
              <div
                key={backup.filename}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {backup.filename}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {formatDate(backup.created)} · {formatSize(backup.size)}
                  </p>
                </div>

                <button
                  onClick={() => handleDownload(backup.filename)}
                  className="ml-3 p-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                  title={t('settings.backup.download')}
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retention Policy Info */}
      {status.enabled && (
        <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                {t('settings.backup.retentionPolicy')}
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• {t('settings.backup.retentionHourly')}</li>
                <li>• {t('settings.backup.retentionDaily')}</li>
                <li>• {t('settings.backup.retentionWeekly')}</li>
                <li>• {t('settings.backup.retentionMonthly')}</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
