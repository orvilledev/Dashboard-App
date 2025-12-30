import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Card, Button, Input } from '@/components/ui';
import { Users, Check, Clock, X, AlertCircle, Loader2, UserPlus, Shield, Plus, Eye, ChevronDown } from 'lucide-react';
import { api } from '@/api';
import { useAuth } from '@/hooks';

// API response types
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

interface ApiTeam {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_by_name: string;
  members_count: number;
  is_member: boolean;
  user_role: 'admin' | 'member' | null;
  has_pending_request: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiJoinRequest {
  id: number;
  team: number;
  team_name: string;
  user: ApiUser;
  message: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export function TeamPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useClerkAuth();
  const { backendUser, isAdmin } = useAuth();
  
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [joinRequests, setJoinRequests] = useState<ApiJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<ApiTeam | null>(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);
  
  // Create team modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamView, setTeamView] = useState<'all' | 'my'>('all');
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const teamDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch data from API
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = await getToken?.();
        
        // Fetch teams and pending join requests for teams user is admin of
        const [teamsResponse, requestsResponse] = await Promise.all([
          api.get<PaginatedResponse<ApiTeam>>('/teams/', token || undefined),
          api.get<ApiJoinRequest[]>('/join-requests/pending_for_my_teams/', token || undefined),
        ]);
        
        setTeams(teamsResponse.results || []);
        setJoinRequests(requestsResponse || []);
      } catch (err) {
        console.error('Failed to fetch team data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [getToken]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target as Node)) {
        setIsTeamDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check current route to set initial view
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/teams/') && path !== '/teams') {
      setTeamView('my');
    } else {
      setTeamView('all');
    }
  }, [location.pathname]);

  const handleJoinRequest = async (team: ApiTeam) => {
    setSelectedTeam(team);
  };

  const submitJoinRequest = async () => {
    if (!selectedTeam) return;
    
    setIsJoining(true);
    try {
      const token = await getToken?.();
      await api.post('/join-requests/', {
        team: selectedTeam.id,
        message: joinMessage,
      }, token || undefined);
      
      // Update team to reflect pending request
      setTeams(teams.map(t => 
        t.id === selectedTeam.id 
          ? { ...t, has_pending_request: true } 
          : t
      ));
      
      setSelectedTeam(null);
      setJoinMessage('');
    } catch (err) {
      console.error('Failed to submit join request:', err);
      alert(err instanceof Error ? err.message : 'Failed to submit join request');
    } finally {
      setIsJoining(false);
    }
  };

  const handleApproveRequest = async (request: ApiJoinRequest) => {
    setProcessingRequestId(request.id);
    try {
      const token = await getToken?.();
      await api.post(`/join-requests/${request.id}/approve/`, {}, token || undefined);
      
      // Remove from pending requests
      setJoinRequests(joinRequests.filter(r => r.id !== request.id));
      
      // Update team member count
      setTeams(teams.map(t => 
        t.id === request.team 
          ? { ...t, members_count: t.members_count + 1 } 
          : t
      ));
    } catch (err) {
      console.error('Failed to approve request:', err);
      alert(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (request: ApiJoinRequest) => {
    setProcessingRequestId(request.id);
    try {
      const token = await getToken?.();
      await api.post(`/join-requests/${request.id}/reject/`, {}, token || undefined);
      
      // Remove from pending requests
      setJoinRequests(joinRequests.filter(r => r.id !== request.id));
    } catch (err) {
      console.error('Failed to reject request:', err);
      alert(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    
    setIsCreatingTeam(true);
    try {
      const token = await getToken?.();
      const newTeam = await api.post<ApiTeam>('/teams/', {
        name: newTeamName.trim(),
        description: newTeamDescription.trim(),
      }, token || undefined);
      
      // Add new team to the list
      setTeams([newTeam, ...teams]);
      
      // Close modal and reset form
      setIsCreateModalOpen(false);
      setNewTeamName('');
      setNewTeamDescription('');
    } catch (err) {
      console.error('Failed to create team:', err);
      alert(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading teams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--color-error)', opacity: 0.2 }}>
            <AlertCircle size={32} style={{ color: 'var(--color-error)' }} />
          </div>
          <h3 className="font-serif text-xl mb-2" style={{ color: 'var(--color-text-primary)' }}>Failed to load teams</h3>
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const myTeams = teams.filter(t => t.is_member);
  const availableTeams = teams.filter(t => !t.is_member);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-serif font-bold text-theme-primary mb-2">Teams</h1>
          <p className="text-theme-secondary">
            Join teams to collaborate with your colleagues and access shared resources.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Team View Dropdown */}
          <div ref={teamDropdownRef} className="relative">
            <button
              onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: '#000000',
                color: '#FFFFFF'
              }}
            >
              <span className="font-medium">
                {teamView === 'all' ? 'All Teams' : 'My Team'}
              </span>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${isTeamDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isTeamDropdownOpen && (
              <div
                className="absolute top-full rounded-lg shadow-lg overflow-hidden z-50 min-w-[160px]"
                style={{
                  right: '50%',
                  marginTop: '4px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <button
                  onClick={() => {
                    setTeamView('all');
                    setIsTeamDropdownOpen(false);
                    navigate('/teams');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left"
                  style={{
                    backgroundColor: teamView === 'all' ? '#000000' : 'transparent',
                    color: teamView === 'all' ? '#FFFFFF' : 'var(--color-text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (teamView !== 'all') {
                      e.currentTarget.style.backgroundColor = '#000000';
                      e.currentTarget.style.color = '#FFFFFF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (teamView !== 'all') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--color-text-secondary)';
                    }
                  }}
                >
                  <span className="font-medium text-sm">All Teams</span>
                </button>
                <button
                  onClick={() => {
                    setTeamView('my');
                    setIsTeamDropdownOpen(false);
                    const myTeams = teams.filter(t => t.is_member);
                    if (myTeams.length > 0) {
                      navigate(`/teams/${myTeams[0].id}`);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left"
                  style={{
                    backgroundColor: teamView === 'my' ? '#000000' : 'transparent',
                    color: teamView === 'my' ? '#FFFFFF' : 'var(--color-text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (teamView !== 'my') {
                      e.currentTarget.style.backgroundColor = '#000000';
                      e.currentTarget.style.color = '#FFFFFF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (teamView !== 'my') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--color-text-secondary)';
                    }
                  }}
                >
                  <span className="font-medium text-sm">My Team</span>
                </button>
              </div>
            )}
          </div>
          {isAdmin && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
              <Plus size={18} /> Create Team
            </Button>
          )}
        </div>
      </div>

      {/* Pending Join Requests for Admins */}
      {joinRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-serif font-semibold text-theme-primary mb-4">Pending Join Requests</h2>
          <Card>
            <div className="divide-y divide-theme-light">
              {joinRequests.map((request) => (
                <div key={request.id} className="flex items-center gap-4 p-4 hover:bg-theme-surface-elevated transition-colors">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-soft" style={{ backgroundColor: '#000000' }}>
                    {request.user.full_name?.charAt(0) || request.user.email?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-theme-primary">{request.user.full_name || request.user.email}</p>
                    <p className="text-sm text-theme-secondary">wants to join {request.team_name}</p>
                    {request.message && (
                      <p className="text-sm text-theme-tertiary mt-1 italic">"{request.message}"</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveRequest(request)}
                      disabled={processingRequestId === request.id}
                      className="bg-theme-success hover:bg-theme-success/80"
                    >
                      {processingRequestId === request.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <><Check size={16} /> Approve</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(request)}
                      disabled={processingRequestId === request.id}
                      className="text-theme-error border-theme-error hover:bg-theme-error/10"
                    >
                      <X size={16} /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* My Teams */}
      {myTeams.length > 0 && (
        <div>
          <h2 className="text-xl font-serif font-semibold text-theme-primary mb-4">My Teams</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {myTeams.map((team) => (
              <Card key={team.id} variant="elevated" className="hover:shadow-medium transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-theme-primary">{team.name}</h3>
                    {team.description && (
                      <p className="text-sm text-theme-secondary mt-1">{team.description}</p>
                    )}
                  </div>
                  {team.user_role === 'admin' && (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-theme-accent/10 text-theme-accent rounded-full">
                      <Shield size={12} /> Admin
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-theme-tertiary">
                    <Users size={14} />
                    <span>{team.members_count} {team.members_count === 1 ? 'member' : 'members'}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/teams/${team.id}`)}
                    className="gap-1"
                  >
                    <Eye size={16} /> View Team
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Teams to Join */}
      {availableTeams.length > 0 && (
        <div>
          <h2 className="text-xl font-serif font-semibold text-theme-primary mb-4">
            {myTeams.length > 0 ? 'Other Teams' : 'Available Teams'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {availableTeams.map((team) => (
              <Card key={team.id} variant="elevated" className="hover:shadow-medium transition-shadow">
                <div className="mb-3">
                  <h3 className="font-serif font-bold text-lg text-theme-primary">{team.name}</h3>
                  {team.description && (
                    <p className="text-sm text-theme-secondary mt-1">{team.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-theme-tertiary">
                    <Users size={14} />
                    <span>{team.members_count} {team.members_count === 1 ? 'member' : 'members'}</span>
                  </div>
                  {team.has_pending_request ? (
                    <span className="flex items-center gap-1 text-xs px-3 py-1.5 bg-theme-warning/10 text-theme-warning rounded-full">
                      <Clock size={12} /> Request Pending
                    </span>
                  ) : (
                    <Button size="sm" onClick={() => handleJoinRequest(team)} className="gap-1">
                      <UserPlus size={16} /> Request to Join
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Teams Message */}
      {teams.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-theme-surface-elevated rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={40} className="text-theme-tertiary" />
          </div>
          <h3 className="font-serif text-xl text-theme-primary mb-2">No teams yet</h3>
          <p className="text-theme-secondary">
            Teams will appear here once they are created by administrators.
          </p>
        </div>
      )}

      {/* Join Request Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface rounded-xl shadow-elevated w-full max-w-md border border-theme-light">
            <div className="flex items-center justify-between p-6 border-b border-theme-light">
              <h2 className="text-xl font-serif font-semibold text-theme-primary">Request to Join Team</h2>
              <button
                onClick={() => setSelectedTeam(null)}
                className="p-2 text-theme-tertiary hover:text-theme-primary rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-theme-secondary mb-2">
                  You're requesting to join <strong className="text-theme-primary">{selectedTeam.name}</strong>
                </p>
                {selectedTeam.description && (
                  <p className="text-sm text-theme-tertiary">{selectedTeam.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1.5">
                  Optional Message (to team admins)
                </label>
                <textarea
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  placeholder="Why do you want to join this team?"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-theme-light bg-theme-background text-theme-primary placeholder:text-theme-tertiary focus:outline-none focus:ring-2 focus:ring-theme-primary/50 focus:border-theme-primary transition-all resize-none"
                />
              </div>

              <div className="text-sm text-theme-tertiary">
                <AlertCircle size={16} className="inline mr-1" />
                A team admin will review your request before you can join.
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTeam(null)}
                  className="flex-1"
                  disabled={isJoining}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitJoinRequest}
                  className="flex-1"
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Send Request'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface rounded-xl shadow-elevated w-full max-w-md border border-theme-light">
            <div className="flex items-center justify-between p-6 border-b border-theme-light">
              <h2 className="text-xl font-serif font-semibold text-theme-primary">Create New Team</h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewTeamName('');
                  setNewTeamDescription('');
                }}
                className="p-2 text-theme-tertiary hover:text-theme-primary rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="p-6 space-y-4">
              <Input
                label="Team Name"
                value={newTeamName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeamName(e.target.value)}
                placeholder="Enter team name"
                required
                autoFocus
              />

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="What is this team for?"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-theme-light bg-theme-background text-theme-primary placeholder:text-theme-tertiary focus:outline-none focus:ring-2 focus:ring-theme-primary/50 focus:border-theme-primary transition-all resize-none"
                />
              </div>

              <div className="text-sm text-theme-tertiary">
                <AlertCircle size={16} className="inline mr-1" />
                You will be automatically added as an admin of this team.
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewTeamName('');
                    setNewTeamDescription('');
                  }}
                  className="flex-1"
                  disabled={isCreatingTeam}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isCreatingTeam || !newTeamName.trim()}
                >
                  {isCreatingTeam ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} className="mr-2" />
                      Create Team
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
