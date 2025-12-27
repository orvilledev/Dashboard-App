import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/hooks';

export function AppLayout() {
  // This hook syncs the Clerk user with the backend when they sign in
  useAuth();

  return (
    <div className="min-h-screen bg-cream-50">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

