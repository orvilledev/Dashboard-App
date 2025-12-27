import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { api } from '@/api';
import { Card, Button } from '@/components/ui';
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  MapPin, 
  Linkedin,
  Twitter,
  Github,
  Building2,
  ShieldCheck,
  Shield
} from 'lucide-react';

interface ApiUser {
  id: number;
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
  team_name?: string;
  user: ApiUser;
  role: 'admin' | 'member';
  joined_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Generate avatar URL
function getAvatarUrl(user: ApiUser): string {
  if (user.avatar_url) {
    if (user.avatar_url.startsWith('/')) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      return `${API_URL}${user.avatar_url}`;
    }
    return user.avatar_url;
  }
  // Never use username (it's often a Clerk ID), prefer email instead
  const seed = user.full_name || user.email || user.first_name || 'User';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function MemberProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { getToken } = useClerkAuth();
  
  const [user, setUser] = useState<ApiUser | null>(null);
  const [teams, setTeams] = useState<ApiTeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Safety check - ensure component always renders something
  if (!userId) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft size={18} /> Back
        </Button>
        <Card className="p-8 text-center">
          <div className="text-theme-tertiary mb-2 text-4xl">⚠️</div>
          <div className="text-theme-primary font-semibold mb-2 text-lg">Invalid User ID</div>
          <div className="text-theme-secondary text-sm">No user ID provided in the URL.</div>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    async function fetchUserData() {
      if (!userId) {
        setError('User ID is required');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const token = await getToken?.();
        
        if (!token) {
          throw new Error('Authentication required. Please sign in.');
        }
        
        console.log('Fetching user profile for ID:', userId);
        
        // Fetch user details
        const userResponse = await api.get<ApiUser>(`/users/${userId}/`, token);
        console.log('User data received:', userResponse);
        
        if (!userResponse || !userResponse.id) {
          throw new Error('Invalid user data received from server');
        }
        
        setUser(userResponse);
        
        // Fetch user's team memberships
        try {
          const membersResponse = await api.get<PaginatedResponse<ApiTeamMember>>(
            `/members/`,
            token
          );
          console.log('Members data received:', membersResponse);
          const userTeams = (membersResponse.results || []).filter(
            m => m.user.id === parseInt(userId)
          );
          console.log('Filtered user teams:', userTeams);
          setTeams(userTeams);
        } catch (membersErr) {
          console.warn('Failed to fetch team memberships:', membersErr);
          // Don't fail the whole page if team memberships fail
          setTeams([]);
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
        setError(errorMessage);
        console.error('Error details:', {
          message: errorMessage,
          error: err,
          userId: userId
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [userId, getToken]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft size={18} /> Back
        </Button>
        <Card className="p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-theme-secondary">Loading profile...</div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft size={18} /> Back
        </Button>
        <Card className="p-8 text-center">
          <div className="text-theme-tertiary mb-2 text-4xl">⚠️</div>
          <div className="text-theme-primary font-semibold mb-2 text-lg">Failed to load profile</div>
          <div className="text-theme-secondary text-sm mb-4">{error || 'User not found'}</div>
          <div className="text-theme-tertiary text-xs">
            {error?.includes('Authentication') && 'Please make sure you are signed in.'}
            {error?.includes('404') && `User with ID ${userId} not found.`}
            {error?.includes('403') && 'You do not have permission to view this profile.'}
          </div>
          <Button 
            variant="primary" 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  // Never use username (it's often a Clerk ID), prefer email instead
  const displayName = user.full_name || user.first_name || user.email || 'User';
  const role = user.is_admin ? 'Administrator' : 'Team Member';

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft size={18} /> Back
        </Button>
      </div>

      {/* LinkedIn-style Profile Card */}
      <Card variant="elevated" className="overflow-hidden">
        {/* Cover Photo Section */}
        <div 
          className="h-48 w-full bg-gradient-to-r from-theme-primary via-theme-accent to-theme-info"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 50%, var(--color-info) 100%)'
          }}
        />
        
        {/* Profile Header */}
        <div className="px-6 pb-6 -mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            {/* Profile Picture and Basic Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="relative">
                <img
                  src={getAvatarUrl(user)}
                  alt={displayName}
                  className="w-32 h-32 rounded-full border-4 border-theme-background shadow-medium bg-theme-surface"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getAvatarUrl(user);
                  }}
                />
                {user.is_admin && (
                  <div className="absolute -bottom-2 -right-2 p-1.5 bg-theme-accent rounded-full shadow-medium">
                    <ShieldCheck size={16} className="text-white" />
                  </div>
                )}
              </div>
              
              <div className="pt-2">
                <h1 className="text-3xl font-serif font-bold text-theme-primary mb-1">
                  {displayName}
                </h1>
                <p className="text-lg text-theme-secondary mb-2">{role}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-theme-tertiary">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} />
                    <span>Location</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail size={14} />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>Joined {formatDate(user.date_joined)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Mail size={16} />
                Message
              </Button>
              <Button variant="primary" className="gap-2">
                Connect
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Section */}
          <Card variant="elevated">
            <h2 className="text-xl font-serif font-semibold text-theme-primary mb-4">About</h2>
            <div className="text-theme-secondary leading-relaxed">
              {user.first_name && user.last_name ? (
                <p>
                  {user.first_name} {user.last_name} is a {role.toLowerCase()} in the organization.
                  {user.is_admin && ' They have administrative privileges and can manage teams, tools, and resources.'}
                </p>
              ) : (
                <p className="text-theme-tertiary italic">No additional information available.</p>
              )}
            </div>
          </Card>

          {/* Experience Section */}
          <Card variant="elevated">
            <h2 className="text-xl font-serif font-semibold text-theme-primary mb-4">Experience</h2>
            {teams.length > 0 ? (
              <div className="space-y-4">
                {teams.map((teamMember) => (
                  <div key={teamMember.id} className="flex gap-4 pb-4 border-b border-theme-light last:border-0">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-theme-primary/10 flex items-center justify-center">
                        <Building2 size={24} className="text-theme-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-theme-primary mb-1">
                        {teamMember.role === 'admin' ? 'Team Administrator' : 'Team Member'}
                      </h3>
                      <p className="text-theme-secondary text-sm mb-1">{teamMember.team_name || 'Team'}</p>
                      <p className="text-theme-tertiary text-xs">
                        {formatDate(teamMember.joined_at)} - Present
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-theme-tertiary italic">No experience listed.</p>
            )}
          </Card>

          {/* Skills Section */}
          <Card variant="elevated">
            <h2 className="text-xl font-serif font-semibold text-theme-primary mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {user.is_admin && (
                <span className="px-3 py-1.5 bg-theme-accent/10 text-theme-accent rounded-full text-sm font-medium">
                  Administration
                </span>
              )}
              <span className="px-3 py-1.5 bg-theme-primary/10 text-theme-primary rounded-full text-sm font-medium">
                Team Collaboration
              </span>
              <span className="px-3 py-1.5 bg-theme-info/10 text-theme-info rounded-full text-sm font-medium">
                Project Management
              </span>
            </div>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Teams Section */}
          <Card variant="elevated">
            <h3 className="font-semibold text-theme-primary mb-4">Teams</h3>
            {teams.length > 0 ? (
              <div className="space-y-3">
                {teams.map((teamMember) => (
                  <div
                    key={teamMember.id}
                    className="p-3 rounded-lg bg-theme-surface hover:bg-theme-surface-elevated transition-colors cursor-pointer"
                    onClick={() => navigate(`/teams/${teamMember.team}`)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-theme-primary text-sm">
                        {teamMember.team_name || 'Team'}
                      </span>
                      {teamMember.role === 'admin' ? (
                        <ShieldCheck size={14} className="text-theme-accent" />
                      ) : (
                        <Shield size={14} className="text-theme-secondary" />
                      )}
                    </div>
                    <p className="text-xs text-theme-tertiary capitalize">{teamMember.role}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-theme-tertiary text-sm italic">Not a member of any teams yet.</p>
            )}
          </Card>

          {/* Contact Info */}
          <Card variant="elevated">
            <h3 className="font-semibold text-theme-primary mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-theme-tertiary" />
                <span className="text-theme-secondary">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={16} className="text-theme-tertiary" />
                <span className="text-theme-secondary">
                  Member since {new Date(user.date_joined).getFullYear()}
                </span>
              </div>
            </div>
          </Card>

          {/* Social Links (Placeholder) */}
          <Card variant="elevated">
            <h3 className="font-semibold text-theme-primary mb-4">Social</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-theme-surface-elevated transition-colors text-sm text-theme-secondary">
                <Linkedin size={16} />
                <span>LinkedIn</span>
              </button>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-theme-surface-elevated transition-colors text-sm text-theme-secondary">
                <Twitter size={16} />
                <span>Twitter</span>
              </button>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-theme-surface-elevated transition-colors text-sm text-theme-secondary">
                <Github size={16} />
                <span>GitHub</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

