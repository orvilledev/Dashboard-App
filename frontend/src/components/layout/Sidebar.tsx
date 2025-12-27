import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Link2,
  FileText,
  CheckSquare,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import { useClerk, useUser } from '@clerk/clerk-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tools', icon: Link2, label: 'Tools' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/team', icon: Users, label: 'Team' },
];

export function Sidebar() {
  const location = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-charcoal-100 flex flex-col shadow-soft">
      {/* Logo */}
      <div className="p-6 border-b border-charcoal-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center shadow-soft">
            <span className="text-white font-serif font-bold text-lg">A</span>
          </div>
          <div>
            <h1 className="font-serif font-bold text-xl text-charcoal-900">AMZPulse</h1>
            <p className="text-xs text-charcoal-400">Workspace Manager</p>
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
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-cream-200 text-charcoal-900'
                  : 'text-charcoal-500 hover:bg-cream-100 hover:text-charcoal-700'
              )}
            >
              <item.icon size={20} strokeWidth={1.5} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-charcoal-100">
        {isAdmin && (
          <NavLink
            to="/settings"
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 mb-2',
              location.pathname === '/settings'
                ? 'bg-cream-200 text-charcoal-900'
                : 'text-charcoal-500 hover:bg-cream-100 hover:text-charcoal-700'
            )}
          >
            <Settings size={20} strokeWidth={1.5} />
            <span className="font-medium">Settings</span>
          </NavLink>
        )}
        
        <div className="flex items-center gap-3 px-4 py-3">
          <img
            src={user?.imageUrl || '/placeholder-avatar.png'}
            alt={user?.fullName || 'User'}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-charcoal-800 truncate">
              {user?.fullName || 'User'}
            </p>
            <p className="text-xs text-charcoal-400 truncate">
              {isAdmin ? 'Admin' : 'Member'}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );
}

