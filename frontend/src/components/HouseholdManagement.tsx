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
      alert('Household created successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create household');
    }
  };

  const handleUpdateHousehold = async () => {
    if (!householdName.trim()) return;

    try {
      const response = await householdsApi.update(householdName);
      setHousehold(response.data.household);
      setEditing(false);
      alert('Household name updated!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update household');
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const response = await householdsApi.createInvite(inviteEmail);
      addInvite(response.data.invite);
      setInviteEmail('');
      alert(`Invite sent! Share this link: ${response.data.inviteLink}`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteInvite = async (inviteId: number) => {
    if (!confirm('Cancel this invite?')) return;

    try {
      await householdsApi.deleteInvite(inviteId);
      removeInvite(inviteId);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete invite');
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
    return <div className="card">Loading household...</div>;
  }

  if (!household) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Create Your Household</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Create a household to collaborate with family members on home maintenance tasks.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            placeholder="e.g., Smith Family Home"
            className="input flex-1"
          />
          <button onClick={handleCreateHousehold} className="btn btn-primary">
            Create Household
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
              {editing ? 'Save' : 'Edit Name'}
            </button>
          )}
        </div>

        {/* Members List */}
        <div>
          <h3 className="font-medium mb-2">Members ({members.length})</h3>
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium">
                  {member.email.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1">{member.email}</span>
                {member.id === household.owner_id && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Owner</span>
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
            Invite Members
          </h3>
          <div className="flex gap-2 mb-4">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address"
              className="input flex-1"
            />
            <button
              onClick={handleSendInvite}
              disabled={inviting}
              className="btn btn-primary"
            >
              {inviting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>

          {/* Pending Invites */}
          {invites.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Pending Invites</h4>
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
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Link
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
