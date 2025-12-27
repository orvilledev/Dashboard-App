import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Link2, FileText, CheckSquare, Users, ArrowRight, Plus } from 'lucide-react';

const quickStats = [
  { label: 'Active Tools', value: '12', icon: Link2, to: '/tools', color: 'bg-blue-100 text-blue-600' },
  { label: 'Documents', value: '24', icon: FileText, to: '/documents', color: 'bg-green-100 text-green-600' },
  { label: 'Open Tasks', value: '8', icon: CheckSquare, to: '/tasks', color: 'bg-amber-100 text-amber-600' },
  { label: 'Team Members', value: '6', icon: Users, to: '/team', color: 'bg-purple-100 text-purple-600' },
];

const recentActivity = [
  { action: 'Document uploaded', item: 'Q4 Report.pdf', time: '2 hours ago', icon: FileText },
  { action: 'Task completed', item: 'Update homepage design', time: '4 hours ago', icon: CheckSquare },
  { action: 'Tool added', item: 'Figma Workspace', time: 'Yesterday', icon: Link2 },
  { action: 'Member invited', item: 'sarah@company.com', time: '2 days ago', icon: Users },
];

export function Dashboard() {
  const { user } = useUser();
  const firstName = user?.firstName || 'there';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-charcoal-900 mb-2">
          Welcome back, {firstName}
        </h1>
        <p className="text-charcoal-500">
          Here's what's happening in your workspace today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat) => (
          <Link key={stat.label} to={stat.to}>
            <Card variant="elevated" className="hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-charcoal-500 mb-1">{stat.label}</p>
                  <p className="text-3xl font-serif font-bold text-charcoal-900">{stat.value}</p>
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
                  className="text-sm text-gold-600 hover:text-gold-700 flex items-center gap-1"
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
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-cream-50 transition-colors"
                  >
                    <div className="p-2 bg-cream-100 rounded-lg">
                      <activity.icon size={18} className="text-charcoal-500" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal-800">{activity.action}</p>
                      <p className="text-sm text-charcoal-500 truncate">{activity.item}</p>
                    </div>
                    <span className="text-xs text-charcoal-400 whitespace-nowrap">
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
                  className="flex items-center gap-3 p-3 rounded-lg border border-charcoal-100 hover:border-gold-300 hover:bg-gold-50 transition-all group"
                >
                  <div className="p-2 bg-cream-100 group-hover:bg-gold-100 rounded-lg transition-colors">
                    <Plus size={18} className="text-charcoal-500 group-hover:text-gold-600" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-medium text-charcoal-700">Add new tool</span>
                </Link>
                <Link
                  to="/documents"
                  className="flex items-center gap-3 p-3 rounded-lg border border-charcoal-100 hover:border-gold-300 hover:bg-gold-50 transition-all group"
                >
                  <div className="p-2 bg-cream-100 group-hover:bg-gold-100 rounded-lg transition-colors">
                    <Plus size={18} className="text-charcoal-500 group-hover:text-gold-600" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-medium text-charcoal-700">Upload document</span>
                </Link>
                <Link
                  to="/tasks"
                  className="flex items-center gap-3 p-3 rounded-lg border border-charcoal-100 hover:border-gold-300 hover:bg-gold-50 transition-all group"
                >
                  <div className="p-2 bg-cream-100 group-hover:bg-gold-100 rounded-lg transition-colors">
                    <Plus size={18} className="text-charcoal-500 group-hover:text-gold-600" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-medium text-charcoal-700">Create task</span>
                </Link>
                <Link
                  to="/team"
                  className="flex items-center gap-3 p-3 rounded-lg border border-charcoal-100 hover:border-gold-300 hover:bg-gold-50 transition-all group"
                >
                  <div className="p-2 bg-cream-100 group-hover:bg-gold-100 rounded-lg transition-colors">
                    <Plus size={18} className="text-charcoal-500 group-hover:text-gold-600" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-medium text-charcoal-700">Invite member</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

