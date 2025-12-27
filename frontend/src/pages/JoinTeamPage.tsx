import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Card, Button } from '@/components/ui';
import { Users, Check, Clock, AlertCircle, Loader2, UserPlus, ArrowRight } from 'lucide-react';
import { api } from '@/api';

interface TeamInvite {
  id: number;
  team: number;
  team_name: string;
  team_description: string;
  email: string;
  invited_by_name: string;
  status: string;
  created_at: string;
  expires_at: string;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function formatTimeUntil(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMs < 0) return 'Expired';
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} left`;
  return 'Expiring soon';
}

export function JoinTeamPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvites() {
      try {
        const token = await getToken?.();
        const response = await api.get<TeamInvite[]>('/invites/my_invites/', token || undefined);
        setInvites(response);
      } catch (err) {
        console.error('Failed to fetch invites:', err);
        setError(err instanceof Error ? err.message : 'Failed to load invites');
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvites();
  }, [getToken]);

  const handleAcceptInvite = async (inviteId: number) => {
    setAcceptingId(inviteId);
    setError(null);
    
    try {
      const token = await getToken?.();
      const response = await api.post<{ message: string }>(`/invites/${inviteId}/accept/`, {}, token || undefined);
      
      setSuccessMessage(response.message);
      setInvites(invites.filter(inv => inv.id !== inviteId));
      
      // Redirect to teams page after a short delay
      setTimeout(() => {
        navigate('/teams');
      }, 2000);
    } catch (err) {
      console.error('Failed to accept invite:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
    } finally {
      setAcceptingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-charcoal-500">Checking for team invites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-charcoal-900 mb-2">
          Join a Team
        </h1>
        <p className="text-charcoal-500">
          Accept pending invitations to join teams and start collaborating.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Check size={20} className="text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">{successMessage}</p>
            <p className="text-sm text-green-600">Redirecting to your team...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={20} className="text-red-600" />
          </div>
          <div>
            <p className="font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Pending Invites */}
      {invites.length > 0 ? (
        <div>
          <h2 className="text-xl font-serif font-semibold text-charcoal-900 mb-4">
            Pending Invitations
          </h2>
          <div className="grid gap-4">
            {invites.map((invite) => (
              <Card key={invite.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center shadow-soft">
                    <Users size={28} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-charcoal-900 mb-1">
                      {invite.team_name}
                    </h3>
                    {invite.team_description && (
                      <p className="text-charcoal-600 text-sm mb-3">
                        {invite.team_description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-charcoal-500">
                      <span className="flex items-center gap-1">
                        <UserPlus size={14} />
                        Invited by {invite.invited_by_name || 'a team admin'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatRelativeTime(invite.created_at)}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                        {formatTimeUntil(invite.expires_at)}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAcceptInvite(invite.id)}
                    disabled={acceptingId === invite.id}
                    className="gap-2"
                  >
                    {acceptingId === invite.id ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Accept & Join
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="text-center py-16">
          <div className="w-20 h-20 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={40} className="text-charcoal-300" />
          </div>
          <h3 className="font-serif text-xl text-charcoal-700 mb-2">
            No Pending Invitations
          </h3>
          <p className="text-charcoal-500 mb-6 max-w-md mx-auto">
            You don't have any pending team invitations at the moment. 
            Ask your team admin to send you an invite using your email: <strong>{user?.primaryEmailAddress?.emailAddress}</strong>
          </p>
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="gap-2">
            Go to Dashboard <ArrowRight size={16} />
          </Button>
        </Card>
      )}
    </div>
  );
}

