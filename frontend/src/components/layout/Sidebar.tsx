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
  UserPlus,
  Star,
  RefreshCw,
} from 'lucide-react';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useAuth } from '@/hooks';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { HandPulseIcon } from '@/components/icons/HandPulseIcon';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tools', icon: Link2, label: 'Tools' },
  { to: '/my-tools', icon: Star, label: 'My Tools' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/teams', icon: Users, label: 'Teams' },
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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
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

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r flex flex-col shadow-soft" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-soft" style={{ backgroundColor: 'var(--color-primary)' }}>
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
                backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)';
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
      </nav>

      {/* User section */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 mb-2"
          style={{
            backgroundColor: location.pathname === '/settings' ? 'var(--color-primary)' : 'transparent',
            color: location.pathname === '/settings' ? '#ffffff' : 'var(--color-text-secondary)',
          }}
          onMouseEnter={(e) => {
            if (location.pathname !== '/settings') {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)';
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
              backgroundColor: isProfileMenuOpen ? 'var(--color-surface-elevated)' : 'transparent',
            }}
          >
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-soft overflow-hidden"
              style={{ backgroundColor: 'var(--color-primary)' }}
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

