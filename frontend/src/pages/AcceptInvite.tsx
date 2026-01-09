import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { householdsApi } from '../lib/api';
import { CheckCircle, XCircle } from 'lucide-react';

export function AcceptInvite() {
  const { t } = useTranslation();
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate(`/login?redirect=/accept-invite/${inviteCode}`);
      return;
    }

    acceptInvite();
  }, [isAuthenticated, inviteCode]);

  const acceptInvite = async () => {
    if (!inviteCode) {
      setStatus('error');
      setMessage(t('invites.inviteInvalid'));
      return;
    }

    try {
      const response = await householdsApi.acceptInvite(inviteCode);
      setStatus('success');
      setMessage(`Successfully joined ${response.data.household.name}!`);
      setTimeout(() => navigate('/'), 2000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.error || t('invites.inviteFailed'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="card max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t('invites.acceptingInvite')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Success!</h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 mt-2">{t('invites.inviteAccepted')}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">
              {t('dashboard.title')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
