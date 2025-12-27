import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Card, Button, Input } from '@/components/ui';
import { UserPlus, Mail, Shield, ShieldCheck, MoreVertical, X, Trash2, Clock, Users, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/api';

// API response types matching backend serializers
interface ApiUser {
  id: number;
  clerk_id: string | null;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url: string | null;
  is_admin: boolean;
  date_joined: string;
}

interface ApiTeamMember {
  id: number;
  team: number;
  user: ApiUser;
  role: 'admin' | 'member';
  joined_at: string;
}

interface ApiInvite {
  id: number;
  team: number;
  email: string;
  invited_by: number;
  invited_by_name: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  created_at: string;
  expires_at: string;
}

// Paginated response wrapper
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
}

// Generate avatar URL
function getAvatarUrl(user: ApiUser): string {
  if (user.avatar_url) return user.avatar_url;
  const seed = user.full_name || user.username || user.email;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

export function TeamPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const isAdmin = user?.publicMetadata?.role === 'admin';
  
  const [members, setMembers] = useState<ApiTeamMember[]>([]);
  const [invites, setInvites] = useState<ApiInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch data from API
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = await getToken?.();
        
        // Fetch members and invites in parallel
        const [membersResponse, invitesResponse] = await Promise.all([
          api.get<PaginatedResponse<ApiTeamMember>>('/members/', token || undefined),
          api.get<PaginatedResponse<ApiInvite>>('/invites/', token || undefined),
        ]);
        
        setMembers(membersResponse.results || []);
        setInvites((invitesResponse.results || []).filter(inv => inv.status === 'pending'));
      } catch (err) {
        console.error('Failed to fetch team data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [getToken]);

  const adminCount = members.filter((m) => m.role === 'admin').length;

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsSubmitting(true);
    try {
      const token = await getToken?.();
      const newInvite = await api.post<ApiInvite>('/invites/', { email: inviteEmail, team: 1 }, token || undefined);
      setInvites([newInvite, ...invites]);
      setInviteEmail('');
      setIsInviteModalOpen(false);
    } catch (err) {
      console.error('Failed to send invite:', err);
      alert(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (memberId: number, newRole: 'admin' | 'member') => {
    try {
      const token = await getToken?.();
      const updatedMember = await api.post<ApiTeamMember>(
        `/members/${memberId}/change_role/`,
        { role: newRole },
        token || undefined
      );
      setMembers(members.map((m) => (m.id === memberId ? updatedMember : m)));
    } catch (err) {
      console.error('Failed to change role:', err);
      alert(err instanceof Error ? err.message : 'Failed to change role');
    }
    setActiveDropdown(null);
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      const token = await getToken?.();
      await api.delete(`/members/${memberId}/`, token || undefined);
      setMembers(members.filter((m) => m.id !== memberId));
    } catch (err) {
      console.error('Failed to remove member:', err);
      alert(err instanceof Error ? err.message : 'Failed to remove member');
    }
    setActiveDropdown(null);
  };

  const handleCancelInvite = async (inviteId: number) => {
    try {
      const token = await getToken?.();
      await api.delete(`/invites/${inviteId}/`, token || undefined);
      setInvites(invites.filter((i) => i.id !== inviteId));
    } catch (err) {
      console.error('Failed to cancel invite:', err);
      alert(err instanceof Error ? err.message : 'Failed to cancel invite');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-charcoal-500">Loading team data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h3 className="font-serif text-xl text-charcoal-900 mb-2">Failed to load team</h3>
          <p className="text-charcoal-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (members.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-charcoal-900 mb-2">Team</h1>
            <p className="text-charcoal-500">Manage your team members and invitations.</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setIsInviteModalOpen(true)} className="gap-2">
              <UserPlus size={18} /> Invite Member
            </Button>
          )}
        </div>
        
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={40} className="text-charcoal-300" />
          </div>
          <h3 className="font-serif text-xl text-charcoal-700 mb-2">No team members yet</h3>
          <p className="text-charcoal-500 mb-6">
            {isAdmin ? 'Start building your team by inviting members.' : 'No team members have been added yet.'}
          </p>
          {isAdmin && (
            <Button onClick={() => setIsInviteModalOpen(true)} className="gap-2">
              <UserPlus size={18} /> Invite Your First Member
            </Button>
          )}
        </div>

        {/* Invite Modal */}
        {isInviteModalOpen && (
          <InviteModal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            inviteEmail={inviteEmail}
            setInviteEmail={setInviteEmail}
            onSubmit={handleInvite}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal-900 mb-2">Team</h1>
          <p className="text-charcoal-500">Manage your team members and invitations.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsInviteModalOpen(true)} className="gap-2">
            <UserPlus size={18} /> Invite Member
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-serif font-bold text-charcoal-900">{members.length}</div>
          <div className="text-sm text-charcoal-500">Team Members</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-serif font-bold text-gold-500">{adminCount}</div>
          <div className="text-sm text-charcoal-500">Admins</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-serif font-bold text-blue-500">{invites.length}</div>
          <div className="text-sm text-charcoal-500">Pending Invites</div>
        </Card>
      </div>

      {/* Members List */}
      <div>
        <h2 className="text-xl font-serif font-semibold text-charcoal-900 mb-4">Members</h2>
        <Card>
          <div className="divide-y divide-charcoal-100">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 p-4 hover:bg-cream-50 transition-colors">
                <img
                  src={getAvatarUrl(member.user)}
                  alt={member.user.full_name}
                  className="w-10 h-10 rounded-full bg-cream-100"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-charcoal-900">{member.user.full_name}</h3>
                    {member.role === 'admin' && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-gold-100 text-gold-700 rounded-full">
                        <ShieldCheck size={12} /> Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-charcoal-500">{member.user.email}</p>
                </div>
                <span className="text-xs text-charcoal-400 hidden sm:block">
                  Joined {formatRelativeTime(member.joined_at)}
                </span>
                {isAdmin && (
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === member.id ? null : member.id)}
                      className="p-2 text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 rounded-lg transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {activeDropdown === member.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-elevated border border-charcoal-100 py-1 z-10">
                        {member.role === 'member' ? (
                          <button
                            onClick={() => handleRoleChange(member.id, 'admin')}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-charcoal-700 hover:bg-cream-50"
                          >
                            <Shield size={16} /> Make Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(member.id, 'member')}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-charcoal-700 hover:bg-cream-50"
                          >
                            <Shield size={16} /> Remove Admin
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div>
          <h2 className="text-xl font-serif font-semibold text-charcoal-900 mb-4">Pending Invites</h2>
          <Card>
            <div className="divide-y divide-charcoal-100">
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center gap-4 p-4 hover:bg-cream-50 transition-colors">
                  <div className="w-10 h-10 bg-cream-100 rounded-full flex items-center justify-center">
                    <Mail size={18} className="text-charcoal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-charcoal-900">{invite.email}</p>
                    <p className="text-sm text-charcoal-500 flex items-center gap-1">
                      <Clock size={12} /> Sent {formatRelativeTime(invite.created_at)}
                      {invite.invited_by_name && ` by ${invite.invited_by_name}`}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full capitalize">
                    {invite.status}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      className="p-2 text-charcoal-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          onSubmit={handleInvite}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

// Invite Modal Component
function InviteModal({
  isOpen,
  onClose,
  inviteEmail,
  setInviteEmail,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  inviteEmail: string;
  setInviteEmail: (email: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-charcoal-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-elevated w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-charcoal-100">
          <h2 className="text-xl font-serif font-semibold text-charcoal-900">Invite Team Member</h2>
          <button
            onClick={onClose}
            className="p-2 text-charcoal-400 hover:text-charcoal-600 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            required
          />
          <p className="text-sm text-charcoal-500">
            An invitation email will be sent to this address with instructions to join your workspace.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                'Send Invite'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
