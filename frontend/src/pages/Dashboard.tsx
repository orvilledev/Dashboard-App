import { Link } from 'react-router-dom';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Link2, CheckSquare, ArrowRight, Plus, Loader2, Star } from 'lucide-react';
import { api } from '@/api';
import { useAuth } from '@/hooks';

// Types for API responses
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}


export function Dashboard() {
  const { user } = useUser();
  const { getToken } = useClerkAuth();
  const { backendUser } = useAuth();
  
  // Use backend first name if available, fallback to Clerk
  const firstName = backendUser?.first_name || user?.firstName || 'there';
  
  const [stats, setStats] = useState({
    myTools: 0,
    openTasks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<Array<{
    action: string;
    item: string;
    time: string;
    timestamp?: number;
    icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  }>>([]);

  // Fetch stats and activities from backend
  useEffect(() => {
    async function fetchStats() {
      try {
        const token = await getToken?.();
        
        // Fetch all counts in parallel
        const [favoritesRes, tasksRes] = await Promise.all([
          api.get<unknown[]>('/tools/favorites/', token || undefined).catch(() => ({ length: 0 })),
          api.get<PaginatedResponse<any>>('/tasks/', token || undefined),
        ]);

        // Count open tasks (To Do + In Progress)
        let openTasksCount = 0;
        if (tasksRes && tasksRes.results && Array.isArray(tasksRes.results)) {
          openTasksCount = tasksRes.results.filter((task: any) => {
            return task.status === 'todo' || task.status === 'in_progress';
          }).length;
        }

        setStats({
          myTools: Array.isArray(favoritesRes) ? favoritesRes.length : 0,
          openTasks: openTasksCount,
        });

        // Fetch recent activities
        await fetchRecentActivities(token || undefined);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [getToken]);

  // Fetch recent activities from backend
  async function fetchRecentActivities(token?: string) {
    try {
      const activities: Array<{
        action: string;
        item: string;
        time: string;
        timestamp?: number;
        icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
      }> = [];


      // Fetch recent tasks
      const tasksRes = await api.get<PaginatedResponse<any>>('/tasks/', token || undefined);
      if (tasksRes.results && tasksRes.results.length > 0) {
        const sortedTasks = [...tasksRes.results].sort((a: any, b: any) => {
          const aTime = a.completed_at ? new Date(a.completed_at).getTime() : new Date(a.created_at).getTime();
          const bTime = b.completed_at ? new Date(b.completed_at).getTime() : new Date(b.created_at).getTime();
          return bTime - aTime;
        });
        sortedTasks.slice(0, 3).forEach((task: any) => {
          if (task.status === 'completed' && task.completed_at) {
            activities.push({
              action: 'Task completed',
              item: task.title,
              time: formatRelativeTime(task.completed_at),
              timestamp: new Date(task.completed_at).getTime(),
              icon: CheckSquare,
            });
          } else {
            activities.push({
              action: 'Task created',
              item: task.title,
              time: formatRelativeTime(task.created_at),
              timestamp: new Date(task.created_at).getTime(),
              icon: CheckSquare,
            });
          }
        });
      }

      // Fetch recent tools
      const toolsRes = await api.get<PaginatedResponse<any>>('/tools/', token || undefined);
      if (toolsRes.results && toolsRes.results.length > 0) {
        const sortedTools = [...toolsRes.results].sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        sortedTools.slice(0, 2).forEach((tool: any) => {
          activities.push({
            action: 'Tool added',
            item: tool.name,
            time: formatRelativeTime(tool.created_at),
            timestamp: new Date(tool.created_at).getTime(),
            icon: Link2,
          });
        });
      }

      // Sort by timestamp (most recent first) and take top 4
      activities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setRecentActivity(activities.slice(0, 4));
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  }

  // Helper function to format relative time
  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  const quickStats = [
    { label: 'My Tools', value: stats.myTools, icon: Star, to: '/my-tools', color: 'bg-theme-primary/10 text-theme-primary' },
    { label: 'Open Tasks', value: stats.openTasks, icon: CheckSquare, to: '/tasks', color: 'bg-theme-warning/10 text-theme-warning' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-theme-primary mb-2">
          Welcome back, {firstName}
        </h1>
        <p className="text-theme-secondary">
          Here's what's happening in your workspace today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-2 gap-6">
        {quickStats.map((stat) => (
          <Link key={stat.label} to={stat.to}>
            <Card variant="elevated" className="hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-theme-secondary mb-1">{stat.label}</p>
                  {isLoading ? (
                    <div className="h-9 flex items-center">
                      <Loader2 size={24} className="animate-spin text-theme-tertiary" />
                    </div>
                  ) : (
                    <p className="text-3xl font-serif font-bold text-theme-primary">{stat.value}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon size={20} strokeWidth={1.5} />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Link
                  to="/activity"
                  className="text-sm text-theme-accent hover:text-theme-primary-hover flex items-center gap-1"
                >
                  View all <ArrowRight size={14} />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-theme-surface-elevated transition-colors"
                  >
                    <div className="p-2 bg-theme-surface-elevated rounded-lg">
                      <activity.icon size={18} className="text-theme-secondary" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-theme-primary">{activity.action}</p>
                      <p className="text-sm text-theme-secondary truncate">{activity.item}</p>
                    </div>
                    <span className="text-xs text-theme-tertiary whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link
                  to="/tools"
                  className="flex items-center gap-3 p-3 rounded-lg border border-theme-light hover:border-theme-primary hover:bg-theme-primary/5 transition-all group"
                >
                  <div className="p-2 bg-theme-surface-elevated group-hover:bg-theme-primary/10 rounded-lg transition-colors">
                    <Plus size={18} className="text-theme-secondary group-hover:text-theme-primary" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-medium text-theme-secondary group-hover:text-theme-primary">Add new tool</span>
                </Link>
                <Link
                  to="/tasks"
                  className="flex items-center gap-3 p-3 rounded-lg border border-theme-light hover:border-theme-primary hover:bg-theme-primary/5 transition-all group"
                >
                  <div className="p-2 bg-theme-surface-elevated group-hover:bg-theme-primary/10 rounded-lg transition-colors">
                    <Plus size={18} className="text-theme-secondary group-hover:text-theme-primary" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-medium text-theme-secondary group-hover:text-theme-primary">Create task</span>
                </Link>
                <Link
                  to="/teams"
                  className="flex items-center gap-3 p-3 rounded-lg border border-theme-light hover:border-theme-primary hover:bg-theme-primary/5 transition-all group"
                >
                  <div className="p-2 bg-theme-surface-elevated group-hover:bg-theme-primary/10 rounded-lg transition-colors">
                    <Plus size={18} className="text-theme-secondary group-hover:text-theme-primary" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-medium text-theme-secondary group-hover:text-theme-primary">Invite member</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

