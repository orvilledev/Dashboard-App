import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Card, Button, Input } from '@/components/ui';
import { Users, ArrowLeft, Shield, ShieldCheck, Loader2, AlertCircle, Camera, X, Upload } from 'lucide-react';
import { api } from '@/api';
import { useAuth } from '@/hooks';

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

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Generate avatar URL
function getAvatarUrl(user: ApiUser, cacheBust?: boolean): string {
  if (user.avatar_url) {
    let url = user.avatar_url;
    // If it's a relative URL, make it absolute
    if (url.startsWith('/')) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      url = `${API_URL}${url}`;
    }
    // Add cache busting only when explicitly requested (after upload)
    if (cacheBust) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}t=${new Date().getTime()}`;
    }
    return url;
  }
  // Never use username (it's often a Clerk ID), prefer email instead
  const seed = user.full_name || user.email || user.first_name || 'User';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { getToken } = useClerkAuth();
  const { backendUser, refreshBackendUser } = useAuth();
  
  const [team, setTeam] = useState<ApiTeam | null>(null);
  const [members, setMembers] = useState<ApiTeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh after avatar update
  
  // Profile picture change modal
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ApiTeamMember | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('file');

  useEffect(() => {
    async function fetchTeamData() {
      if (!teamId) {
        setError('Team ID is required');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const token = await getToken?.();
        
        // Fetch team details and members in parallel
        const [teamResponse, membersResponse] = await Promise.all([
          api.get<ApiTeam>(`/teams/${teamId}/`, token || undefined),
          api.get<PaginatedResponse<ApiTeamMember>>(`/members/`, token || undefined),
        ]);
        
        setTeam(teamResponse);
        // Filter members by team ID (backend returns all members, we filter by team)
        const teamMembers = (membersResponse.results || []).filter(m => m.team === parseInt(teamId));
        setMembers(teamMembers);
      } catch (err) {
        console.error('Failed to fetch team data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTeamData();
  }, [teamId, getToken, refreshKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading team...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--color-error)', opacity: 0.2 }}>
            <AlertCircle size={32} style={{ color: 'var(--color-error)' }} />
          </div>
          <h3 className="font-serif text-xl mb-2" style={{ color: 'var(--color-text-primary)' }}>Failed to load team</h3>
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>{error || 'Team not found'}</p>
          <Button onClick={() => navigate('/teams')}>Back to Teams</Button>
        </div>
      </div>
    );
  }

  const adminMembers = members.filter(m => m.role === 'admin');
  const regularMembers = members.filter(m => m.role === 'member');
  
  const handleChangeAvatar = (member: ApiTeamMember) => {
    // Only allow users to change their own avatar
    if (member.user.id !== backendUser?.id) return;
    
    setSelectedMember(member);
    setAvatarUrl(member.user.avatar_url || '');
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadMethod('file');
    setIsAvatarModalOpen(true);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleUpdateAvatar = async () => {
    if (!selectedMember || !backendUser) return;
    
    setIsUpdatingAvatar(true);
    try {
      const token = await getToken?.();
      let updatedUser: ApiUser;
      
      if (uploadMethod === 'file' && selectedFile) {
        // Upload file
        const formData = new FormData();
        formData.append('avatar', selectedFile);
        
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const response = await fetch(`${API_URL}/users/upload_avatar/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Failed to upload avatar' }));
          throw new Error(error.error || error.message || 'Failed to upload avatar');
        }
        
        const result = await response.json();
        updatedUser = result.user;
      } else {
        // Update avatar URL via backend
        updatedUser = await api.patch<ApiUser>(
          '/users/update_profile/',
          { avatar_url: avatarUrl.trim() || null },
          token || undefined
        );
      }
      
      // Refresh global user cache first
      await refreshBackendUser();
      
      // Explicitly refetch team members to get updated avatar
      try {
        const membersResponse = await api.get<PaginatedResponse<ApiTeamMember>>(`/members/`, token || undefined);
        const teamMembers = (membersResponse.results || []).filter(m => m.team === parseInt(teamId!));
        // Update members with fresh data
        setMembers(teamMembers.map(m => {
          if (m.user.id === updatedUser.id) {
            return { ...m, user: updatedUser };
          }
          return m;
        }));
      } catch (err) {
        console.error('Failed to refresh members after avatar update:', err);
        // Fallback: update the member in the current list
        setMembers(members.map(m => 
          m.user.id === selectedMember.user.id
            ? { ...m, user: { ...m.user, avatar_url: updatedUser.avatar_url } }
            : m
        ));
      }
      
      // Force refresh as backup
      setRefreshKey(prev => prev + 1);
      
      setIsAvatarModalOpen(false);
      setSelectedMember(null);
      setAvatarUrl('');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error('Failed to update avatar:', err);
      alert(err instanceof Error ? err.message : 'Failed to update profile picture');
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/teams')}
            className="gap-2"
          >
            <ArrowLeft size={18} /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-serif font-bold text-theme-primary mb-2">{team.name}</h1>
            {team.description && (
              <p className="text-theme-secondary">{team.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-theme-tertiary">
          <Users size={18} />
          <span>{members.length} {members.length === 1 ? 'member' : 'members'}</span>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-serif font-bold text-theme-primary">{members.length}</div>
          <div className="text-sm text-theme-secondary">Total Members</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-serif font-bold text-theme-accent">{adminMembers.length}</div>
          <div className="text-sm text-theme-secondary">Admins</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-serif font-bold text-theme-info">{regularMembers.length}</div>
          <div className="text-sm text-theme-secondary">Members</div>
        </Card>
      </div>

      {/* Team Members Grid - Similar to Tools Page Format */}
      <div>
        <h2 className="text-xl font-serif font-semibold text-theme-primary mb-4">Team Members</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <Card 
              key={member.id} 
              variant="elevated" 
              className="group cursor-pointer transition-all duration-200 hover:-translate-y-2 hover:shadow-2xl"
              onClick={() => navigate(`/profile/${member.user.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-primary-light)' }}>
                  <Users size={24} style={{ color: 'var(--color-primary)' }} strokeWidth={1.5} />
                </div>
                {member.role === 'admin' && (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 bg-theme-accent/10 text-theme-accent rounded-full">
                    {member.role === 'admin' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                    {member.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <img
                    key={`avatar-${member.user.id}-${member.user.avatar_url || 'default'}`}
                    src={getAvatarUrl(member.user)}
                    alt={member.user.full_name || member.user.email}
                    className="w-12 h-12 rounded-full bg-theme-surface-elevated border-2"
                    style={{ borderColor: 'var(--color-border)' }}
                    onError={(e) => {
                      // Fallback to generated avatar if image fails to load
                      (e.target as HTMLImageElement).src = getAvatarUrl(member.user);
                    }}
                  />
                  {member.user.id === backendUser?.id && (
                    <button
                      onClick={() => handleChangeAvatar(member)}
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-full shadow-soft transition-colors group"
                      style={{ 
                        backgroundColor: 'var(--color-primary)',
                        border: '2px solid var(--color-surface)'
                      }}
                      title="Change profile picture"
                    >
                      <Camera size={12} className="text-white" />
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-semibold text-lg mb-0.5 truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {member.user.full_name || member.user.first_name || member.user.email}
                  </h3>
                  <p className="text-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>
                    {member.user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                <span 
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ 
                    backgroundColor: member.role === 'admin' ? 'var(--color-accent)' + '20' : 'var(--color-surface-elevated)',
                    color: member.role === 'admin' ? 'var(--color-accent)' : 'var(--color-text-secondary)'
                  }}
                >
                  {member.role === 'admin' ? 'Administrator' : 'Team Member'}
                </span>
                <span className="text-xs text-theme-tertiary">
                  Joined {new Date(member.joined_at).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {members.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--color-surface-elevated)' }}>
            <Users size={32} style={{ color: 'var(--color-text-tertiary)' }} />
          </div>
          <h3 className="font-serif text-xl mb-2" style={{ color: 'var(--color-text-primary)' }}>No members yet</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            This team doesn't have any members yet.
          </p>
        </div>
      )}

      {/* Change Avatar Modal */}
      {isAvatarModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface rounded-xl shadow-elevated w-full max-w-md border border-theme-light">
            <div className="flex items-center justify-between p-6 border-b border-theme-light">
              <h2 className="text-xl font-serif font-semibold text-theme-primary">Change Profile Picture</h2>
              <button
                onClick={() => {
                  setIsAvatarModalOpen(false);
                  setSelectedMember(null);
                  setAvatarUrl('');
                }}
                className="p-2 text-theme-tertiary hover:text-theme-primary rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Current Avatar Preview */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img
                    src={previewUrl || avatarUrl || getAvatarUrl(selectedMember.user)}
                    alt={selectedMember.user.full_name || selectedMember.user.email}
                    className="w-24 h-24 rounded-full bg-theme-surface-elevated border-2"
                    style={{ borderColor: 'var(--color-border)' }}
                    onError={(e) => {
                      // Fallback to generated avatar if URL fails
                      (e.target as HTMLImageElement).src = getAvatarUrl(selectedMember.user);
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="font-medium text-theme-primary">{selectedMember.user.full_name || selectedMember.user.email}</p>
                  <p className="text-sm text-theme-secondary">{selectedMember.user.email}</p>
                </div>
              </div>

              {/* Upload Method Toggle */}
              <div className="flex border border-theme-light rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMethod('file');
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    uploadMethod === 'file'
                      ? 'bg-theme-primary text-white'
                      : 'bg-theme-surface text-theme-secondary hover:bg-theme-surface-elevated'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMethod('url');
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    uploadMethod === 'url'
                      ? 'bg-theme-primary text-white'
                      : 'bg-theme-surface text-theme-secondary hover:bg-theme-surface-elevated'
                  }`}
                >
                  Enter URL
                </button>
              </div>

              {/* File Upload */}
              {uploadMethod === 'file' && (
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1.5">
                    Upload Image
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div className="px-4 py-2.5 rounded-lg border border-theme-light bg-theme-background text-theme-primary hover:bg-theme-surface-elevated transition-colors text-center">
                        {selectedFile ? selectedFile.name : 'Choose File'}
                      </div>
                    </label>
                    {selectedFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-theme-tertiary mt-1.5">
                    JPG, PNG, GIF or WebP. Max size: 5MB
                  </p>
                </div>
              )}

              {/* Avatar URL Input */}
              {uploadMethod === 'url' && (
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1.5">
                    Profile Picture URL
                  </label>
                  <Input
                    type="url"
                    value={avatarUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <p className="text-xs text-theme-tertiary mt-1.5">
                    Enter a URL to an image. Leave empty to use default avatar.
                  </p>
                </div>
              )}

              {/* Preview Note */}
              <div className="text-sm text-theme-tertiary flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>Your profile picture will be visible to all team members.</span>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAvatarModalOpen(false);
                    setSelectedMember(null);
                    setAvatarUrl('');
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="flex-1"
                  disabled={isUpdatingAvatar}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateAvatar}
                  className="flex-1"
                  disabled={isUpdatingAvatar || (uploadMethod === 'file' && !selectedFile) || (uploadMethod === 'url' && !avatarUrl.trim())}
                >
                  {isUpdatingAvatar ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      {uploadMethod === 'file' ? 'Uploading...' : 'Updating...'}
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      {uploadMethod === 'file' ? 'Upload Picture' : 'Update Picture'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

