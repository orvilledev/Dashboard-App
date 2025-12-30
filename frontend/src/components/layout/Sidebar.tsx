import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Link2,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  ChevronUp,
  ChevronDown,
  UserPlus,
  Star,
  RefreshCw,
  Calendar,
  Wrench,
  CalendarDays,
  User,
} from 'lucide-react';
import { useClerk, useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth } from '@/hooks';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { HandPulseIcon } from '@/components/icons/HandPulseIcon';
import { api } from '@/api';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
];

const toolsSubItems = [
  { to: '/tools', icon: Wrench, label: 'Public Tools' },
  { to: '/my-tools', icon: Star, label: 'My Toolbox' },
];

const teamsSubItems = [
  { to: '/teams', icon: Users, label: 'All Teams' },
  { to: '/teams/my', icon: Users, label: 'My Team' },
  { to: '/profile/my', icon: User, label: 'My Profile', isDynamic: true },
];

const leaveScheduleSubItems = [
  { to: '/leave-schedule', icon: CalendarDays, label: 'My Schedule' },
  { to: '/leave-schedule?view=team', icon: CalendarDays, label: 'Team Schedule' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { isAdmin, backendUser, refreshBackendUser } = useAuth(); // Get admin status and user info from backend
  
  // Use backend name if available, fallback to Clerk name or email (never use username)
  const displayName = backendUser?.full_name || backendUser?.first_name || user?.fullName || backendUser?.email || user?.primaryEmailAddress?.emailAddress || 'User';
  const displayInitial = displayName.charAt(0) || 'U';
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const [isTeamsMenuOpen, setIsTeamsMenuOpen] = useState(false);
  const teamsMenuRef = useRef<HTMLDivElement>(null);
  const [isLeaveScheduleMenuOpen, setIsLeaveScheduleMenuOpen] = useState(false);
  const leaveScheduleMenuRef = useRef<HTMLDivElement>(null);
  const { getToken } = useClerkAuth();

  // Check if any tools sub-item is active
  const isToolsActive = toolsSubItems.some(item => location.pathname === item.to);
  
  // Check if any teams sub-item is active
  const isTeamsActive = location.pathname === '/teams' || 
    (location.pathname.startsWith('/teams/') && location.pathname !== '/teams') ||
    (location.pathname.startsWith('/profile/') && backendUser && location.pathname === `/profile/${backendUser.id}`);
  
  // Check if any leave schedule sub-item is active
  const isLeaveScheduleActive = location.pathname === '/leave-schedule';

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
      if (teamsMenuRef.current && !teamsMenuRef.current.contains(event.target as Node)) {
        setIsTeamsMenuOpen(false);
      }
      if (leaveScheduleMenuRef.current && !leaveScheduleMenuRef.current.contains(event.target as Node)) {
        setIsLeaveScheduleMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleJoinTeam = () => {
    setIsProfileMenuOpen(false);
    navigate('/join-team');
  };

  const handleSignOut = () => {
    setIsProfileMenuOpen(false);
    signOut();
  };

  const handleMyTeamClick = async () => {
    setIsTeamsMenuOpen(false);
    try {
      const token = await getToken?.();
      const teamsResponse = await api.get<{ results: Array<{ id: number; is_member: boolean }> }>('/teams/', token || undefined);
      const myTeams = (teamsResponse.results || []).filter(t => t.is_member);
      if (myTeams.length > 0) {
        navigate(`/teams/${myTeams[0].id}`);
      } else {
        navigate('/teams');
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err);
      navigate('/teams');
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r flex flex-col shadow-soft" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', zIndex: 100 }}>
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-soft" style={{ backgroundColor: '#000000' }}>
            <HandPulseIcon size={20} color="white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-serif font-bold text-xl" style={{ color: 'var(--color-text-primary)' }}>AMZPulse</h1>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Workspace Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: isActive ? '#000000' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#000000';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }
              }}
            >
              <item.icon size={20} strokeWidth={1.5} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}

        {/* Tools Menu with Dropdown */}
        <div 
          ref={toolsMenuRef} 
          className="relative"
          onMouseEnter={() => setIsToolsMenuOpen(true)}
          onMouseLeave={() => setIsToolsMenuOpen(false)}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: isToolsActive || isToolsMenuOpen ? '#000000' : 'transparent',
              color: isToolsActive || isToolsMenuOpen ? '#ffffff' : 'var(--color-text-secondary)',
            }}
          >
            <Wrench size={20} strokeWidth={1.5} />
            <span className="font-medium flex-1">Tools</span>
            <ChevronDown
              size={18}
              strokeWidth={1.5}
              className={clsx(
                'transition-transform duration-200',
                isToolsMenuOpen ? 'rotate-180' : ''
              )}
            />
          </div>

          {/* Tools Dropdown Menu */}
          {isToolsMenuOpen && (
            <div
              className="absolute top-0 rounded-lg shadow-lg overflow-visible min-w-[180px]"
              style={{
                left: '50%',
                pointerEvents: 'auto',
                zIndex: 9999
              }}
              onMouseEnter={() => setIsToolsMenuOpen(true)}
              onMouseLeave={() => setIsToolsMenuOpen(false)}
            >
              <div
                className="rounded-lg overflow-hidden"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)'
                }}
              >
                {toolsSubItems.map((subItem) => {
                  const isSubActive = location.pathname === subItem.to;
                  return (
                    <NavLink
                      key={subItem.to}
                      to={subItem.to}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                      style={{
                        backgroundColor: isSubActive ? '#000000' : 'transparent',
                        color: isSubActive ? '#ffffff' : 'var(--color-text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubActive) {
                          e.currentTarget.style.backgroundColor = '#000000';
                          e.currentTarget.style.color = '#ffffff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--color-text-secondary)';
                        }
                      }}
                    >
                      <subItem.icon size={18} strokeWidth={1.5} />
                      <span className="font-medium text-sm">{subItem.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Teams Menu with Dropdown */}
        <div 
          ref={teamsMenuRef} 
          className="relative"
          onMouseEnter={() => setIsTeamsMenuOpen(true)}
          onMouseLeave={() => setIsTeamsMenuOpen(false)}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: isTeamsActive || isTeamsMenuOpen ? '#000000' : 'transparent',
              color: isTeamsActive || isTeamsMenuOpen ? '#ffffff' : 'var(--color-text-secondary)',
            }}
          >
            <Users size={20} strokeWidth={1.5} />
            <span className="font-medium flex-1">Teams</span>
            <ChevronDown
              size={18}
              strokeWidth={1.5}
              className={clsx(
                'transition-transform duration-200',
                isTeamsMenuOpen ? 'rotate-180' : ''
              )}
            />
          </div>

          {/* Teams Dropdown Menu */}
          {isTeamsMenuOpen && (
            <div
              className="absolute top-0 rounded-lg shadow-lg overflow-visible min-w-[180px]"
              style={{
                left: '50%',
                pointerEvents: 'auto',
                zIndex: 9999
              }}
              onMouseEnter={() => setIsTeamsMenuOpen(true)}
              onMouseLeave={() => setIsTeamsMenuOpen(false)}
            >
              <div
                className="rounded-lg overflow-hidden"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)'
                }}
              >
              <NavLink
                to="/teams"
                onClick={() => setIsTeamsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                style={{
                  backgroundColor: location.pathname === '/teams' ? '#000000' : 'transparent',
                  color: location.pathname === '/teams' ? '#ffffff' : 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== '/teams') {
                    e.currentTarget.style.backgroundColor = '#000000';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== '/teams') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }
                }}
              >
                <Users size={18} strokeWidth={1.5} />
                <span className="font-medium text-sm">All Teams</span>
              </NavLink>
              <button
                onClick={handleMyTeamClick}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left"
                style={{
                  backgroundColor: location.pathname.startsWith('/teams/') && location.pathname !== '/teams' ? '#000000' : 'transparent',
                  color: location.pathname.startsWith('/teams/') && location.pathname !== '/teams' ? '#ffffff' : 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (!(location.pathname.startsWith('/teams/') && location.pathname !== '/teams')) {
                    e.currentTarget.style.backgroundColor = '#000000';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(location.pathname.startsWith('/teams/') && location.pathname !== '/teams')) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }
                }}
              >
                <Users size={18} strokeWidth={1.5} />
                <span className="font-medium text-sm">My Team</span>
              </button>
              {backendUser && (
                <NavLink
                  to={`/profile/${backendUser.id}`}
                  className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors"
                  style={{
                    backgroundColor: location.pathname === `/profile/${backendUser.id}` ? '#000000' : 'transparent',
                    color: location.pathname === `/profile/${backendUser.id}` ? '#ffffff' : 'var(--color-text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (location.pathname !== `/profile/${backendUser.id}`) {
                      e.currentTarget.style.backgroundColor = '#000000';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== `/profile/${backendUser.id}`) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--color-text-secondary)';
                    }
                  }}
                >
                  <User size={18} strokeWidth={1.5} />
                  <span className="font-medium text-sm">My Profile</span>
                </NavLink>
              )}
              </div>
            </div>
          )}
        </div>

        {/* Leave Schedule Menu with Dropdown */}
        <div 
          ref={leaveScheduleMenuRef} 
          className="relative"
          onMouseEnter={() => setIsLeaveScheduleMenuOpen(true)}
          onMouseLeave={() => setIsLeaveScheduleMenuOpen(false)}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: isLeaveScheduleActive || isLeaveScheduleMenuOpen ? '#000000' : 'transparent',
              color: isLeaveScheduleActive || isLeaveScheduleMenuOpen ? '#ffffff' : 'var(--color-text-secondary)',
            }}
          >
            <Calendar size={20} strokeWidth={1.5} />
            <span className="font-medium flex-1">Leave Schedule</span>
            <ChevronDown
              size={18}
              strokeWidth={1.5}
              className={clsx(
                'transition-transform duration-200',
                isLeaveScheduleMenuOpen ? 'rotate-180' : ''
              )}
            />
          </div>

          {/* Leave Schedule Dropdown Menu */}
          {isLeaveScheduleMenuOpen && (
            <div
              className="absolute top-0 rounded-lg shadow-lg overflow-visible min-w-[180px]"
              style={{
                left: '50%',
                pointerEvents: 'auto',
                zIndex: 9999
              }}
              onMouseEnter={() => setIsLeaveScheduleMenuOpen(true)}
              onMouseLeave={() => setIsLeaveScheduleMenuOpen(false)}
            >
              <div
                className="rounded-lg overflow-hidden"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)'
                }}
              >
                {leaveScheduleSubItems.map((subItem) => {
                  const isSubActive = location.pathname === subItem.to || 
                    (subItem.to.includes('view=team') && new URLSearchParams(location.search).get('view') === 'team');
                  return (
                    <NavLink
                      key={subItem.to}
                      to={subItem.to}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                      style={{
                        backgroundColor: isSubActive ? '#000000' : 'transparent',
                        color: isSubActive ? '#ffffff' : 'var(--color-text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubActive) {
                          e.currentTarget.style.backgroundColor = '#000000';
                          e.currentTarget.style.color = '#ffffff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--color-text-secondary)';
                        }
                      }}
                    >
                      <subItem.icon size={18} strokeWidth={1.5} />
                      <span className="font-medium text-sm">{subItem.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* User section */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 mb-2"
          style={{
            backgroundColor: location.pathname === '/settings' ? '#000000' : 'transparent',
            color: location.pathname === '/settings' ? '#ffffff' : 'var(--color-text-secondary)',
          }}
          onMouseEnter={(e) => {
            if (location.pathname !== '/settings') {
              e.currentTarget.style.backgroundColor = '#000000';
              e.currentTarget.style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            if (location.pathname !== '/settings') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }
          }}
        >
          <Settings size={20} strokeWidth={1.5} />
          <span className="font-medium">Settings</span>
        </NavLink>
        
        {/* Profile dropdown */}
        <div ref={profileMenuRef} className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: isProfileMenuOpen ? '#000000' : 'transparent',
            }}
          >
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-soft overflow-hidden"
              style={{ backgroundColor: '#000000' }}
            >
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{displayInitial}</span>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                {displayName}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                {isAdmin ? 'Admin' : 'Member'}
              </p>
            </div>
            <ChevronUp
              size={18}
              strokeWidth={1.5}
              className={clsx(
                'transition-transform duration-200',
                isProfileMenuOpen ? 'rotate-180' : ''
              )}
              style={{ color: 'var(--color-text-secondary)' }}
            />
          </button>

          {/* Dropdown menu */}
          {isProfileMenuOpen && (
            <div 
              className="absolute bottom-full left-0 right-0 mb-2 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
              style={{ 
                backgroundColor: 'var(--color-surface)', 
                border: '1px solid var(--color-border)' 
              }}
            >
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Theme</span>
                  <ThemeSwitcher />
                </div>
              </div>
              <button
                onClick={async () => {
                  setIsProfileMenuOpen(false);
                  console.log('Manually refreshing user status...');
                  await refreshBackendUser();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                <RefreshCw size={18} strokeWidth={1.5} />
                <span className="font-medium">Refresh Status</span>
              </button>
              <button
                onClick={handleJoinTeam}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                <UserPlus size={18} strokeWidth={1.5} />
                <span className="font-medium">Join Team</span>
              </button>
              <div style={{ borderTop: '1px solid var(--color-border)' }} />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{ color: 'var(--color-error)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-error)';
                }}
              >
                <LogOut size={18} strokeWidth={1.5} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

