import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHouseholdStore } from '../store/householdStore';
import { useAuthStore } from '../store/authStore';
import { householdsApi } from '../lib/api';
import { Users, Mail, Trash2, Copy, CheckCircle } from 'lucide-react';

export function HouseholdManagement() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { household, members, invites, setHousehold, setMembers, setInvites, addInvite, removeInvite } = useHouseholdStore();
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [editing, setEditing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadHousehold();
  }, []);

  const loadHousehold = async () => {
    try {
      const response = await householdsApi.get();
      setHousehold(response.data.household);
      setMembers(response.data.members);
      setInvites(response.data.invites);
      if (response.data.household) {
        setHouseholdName(response.data.household.name);
      }
    } catch (error) {
      console.error('Failed to load household:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) return;

    try {
      const response = await householdsApi.create(householdName);
      setHousehold(response.data.household);
      alert(t('household.householdCreated'));
    } catch (error: any) {
      alert(error.response?.data?.error || t('household.failedToCreate'));
    }
  };

  const handleUpdateHousehold = async () => {
    if (!householdName.trim()) return;

    try {
      const response = await householdsApi.update(householdName);
      setHousehold(response.data.household);
      setEditing(false);
      alert(t('household.householdUpdated'));
    } catch (error: any) {
      alert(error.response?.data?.error || t('household.failedToUpdate'));
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const response = await householdsApi.createInvite(inviteEmail);
      addInvite(response.data.invite);
      setInviteEmail('');
      alert(t('household.inviteSent', { link: response.data.inviteLink }));
    } catch (error: any) {
      alert(error.response?.data?.error || t('household.failedToInvite'));
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteInvite = async (inviteId: number) => {
    if (!confirm(t('household.cancelInvite'))) return;

    try {
      await householdsApi.deleteInvite(inviteId);
      removeInvite(inviteId);
    } catch (error: any) {
      alert(error.response?.data?.error || t('household.failedToDeleteInvite'));
    }
  };

  const copyInviteLink = (inviteCode: string) => {
    const link = `${window.location.origin}/accept-invite/${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(inviteCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isOwner = household && user && household.owner_id === user.id;

  if (loading) {
    return <div className="card">{t('household.loadingHousehold')}</div>;
  }

  if (!household) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">{t('household.createYourHousehold')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('household.createDescription')}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            placeholder={t('household.householdNamePlaceholder')}
            className="input flex-1"
          />
          <button onClick={handleCreateHousehold} className="btn btn-primary">
            {t('household.createHousehold')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Household Info */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            {editing ? (
              <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                className="input"
              />
            ) : (
              household.name
            )}
          </h2>
          {isOwner && (
            <button
              onClick={() => editing ? handleUpdateHousehold() : setEditing(true)}
              className="btn btn-secondary"
            >
              {editing ? t('common.save') : t('household.editName')}
            </button>
          )}
        </div>

        {/* Members List */}
        <div>
          <h3 className="font-medium mb-2">{t('household.members')} ({members.length})</h3>
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium">
                  {member.email.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1">{member.email}</span>
                {member.id === household.owner_id && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">{t('household.owner')}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite Members */}
      {isOwner && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            {t('household.inviteMembers')}
          </h3>
          <div className="flex gap-2 mb-4">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder={t('household.inviteEmailPlaceholder')}
              className="input flex-1"
            />
            <button
              onClick={handleSendInvite}
              disabled={inviting}
              className="btn btn-primary"
            >
              {inviting ? t('household.sending') : t('household.sendInvite')}
            </button>
          </div>

          {/* Pending Invites */}
          {invites.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">{t('household.pendingInvites')}</h4>
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div key={invite.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="flex-1">{invite.email}</span>
                    <button
                      onClick={() => copyInviteLink(invite.invite_code)}
                      className="btn btn-secondary text-sm px-3 py-1 flex items-center gap-1"
                    >
                      {copiedCode === invite.invite_code ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          {t('household.copied')}
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          {t('household.copyLink')}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteInvite(invite.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
