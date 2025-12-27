import { useState, useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks';
import { api } from '@/api';
import { Plus, CheckCircle2, Circle, Clock, Trash2, X, Calendar, ExternalLink, Link2, Loader2 } from 'lucide-react';

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

interface ApiTask {
  id: number;
  title: string;
  description: string;
  link: string | null;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  assignee: number | null;
  assignee_name: string | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface Task {
  id: number;
  title: string;
  description: string;
  link?: string;
  status: 'todo' | 'in_progress' | 'completed';
  dueDate: string;
  assignee: string;
  assigneeId?: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const statusConfig = {
  todo: { label: 'To Do', icon: Circle, color: 'text-theme-tertiary', bg: 'bg-theme-surface-elevated' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-theme-warning', bg: 'bg-theme-warning/10' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-theme-success', bg: 'bg-theme-success/10' },
};

export function TasksPage() {
  const { isAdmin } = useAuth();
  const { getToken } = useClerkAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<ApiTeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    status: 'todo' as Task['status'],
    dueDate: '',
    assignee: '',
    assigneeId: undefined as number | undefined,
  });
  const [filterStatus, setFilterStatus] = useState<'all' | Task['status']>('all');

  // Convert API task to frontend task format
  const convertApiTaskToTask = (apiTask: ApiTask): Task => {
    return {
      id: apiTask.id,
      title: apiTask.title,
      description: apiTask.description || '',
      link: apiTask.link || undefined,
      status: apiTask.status,
      dueDate: apiTask.due_date ? new Date(apiTask.due_date).toISOString().split('T')[0] : '',
      assignee: apiTask.assignee_name || '',
      assigneeId: apiTask.assignee || undefined,
    };
  };

  // Fetch tasks from backend
  useEffect(() => {
    async function fetchTasks() {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getToken?.();
        const response = await api.get<PaginatedResponse<ApiTask>>('/tasks/', token || undefined);
        const convertedTasks = (response.results || []).map(convertApiTaskToTask);
        setTasks(convertedTasks);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tasks');
      } finally {
        setIsLoading(false);
      }
    }
    fetchTasks();
  }, [getToken]);

  // Fetch team members
  useEffect(() => {
    async function fetchTeamMembers() {
      setIsLoadingMembers(true);
      try {
        const token = await getToken?.();
        const response = await api.get<PaginatedResponse<ApiTeamMember>>('/members/', token || undefined);
        setTeamMembers(response.results || []);
      } catch (err) {
        console.error('Failed to fetch team members:', err);
      } finally {
        setIsLoadingMembers(false);
      }
    }
    fetchTeamMembers();
  }, [getToken]);

  const filteredTasks = filterStatus === 'all' ? tasks : tasks.filter((t) => t.status === filterStatus);
  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = await getToken?.();
      
      const taskData = {
        title: formData.title,
        description: formData.description,
        link: formData.link || null,
        status: formData.status,
        priority: 'medium', // Default priority
        due_date: formData.dueDate || null,
        assignee: formData.assigneeId || null,
      };

      if (editingTask) {
        // Update existing task
        const updated = await api.patch<ApiTask>(
          `/tasks/${editingTask.id}/`,
          taskData,
          token || undefined
        );
        setTasks(tasks.map((t) => (t.id === editingTask.id ? convertApiTaskToTask(updated) : t)));
      } else {
        // Create new task
        const created = await api.post<ApiTask>(
          '/tasks/',
          taskData,
          token || undefined
        );
        setTasks([...tasks, convertApiTaskToTask(created)]);
      }
      closeModal();
    } catch (err) {
      console.error('Failed to save task:', err);
      alert(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      link: task.link || '',
      status: task.status,
      dueDate: task.dueDate,
      assignee: task.assignee,
      assigneeId: task.assigneeId,
    });
    setIsModalOpen(true);
  };

  const handleStatusChange = async (taskId: number, newStatus: Task['status']) => {
    try {
      const token = await getToken?.();
      // Use the update_status endpoint which allows all users to change status
      const updated = await api.patch<ApiTask>(
        `/tasks/${taskId}/update_status/`,
        { status: newStatus },
        token || undefined
      );
      setTasks(tasks.map((t) => (t.id === taskId ? convertApiTaskToTask(updated) : t)));
    } catch (err) {
      console.error('Failed to update task status:', err);
      alert(err instanceof Error ? err.message : 'Failed to update task status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const token = await getToken?.();
      await api.delete(`/tasks/${id}/`, token || undefined);
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setFormData({ title: '', description: '', link: '', status: 'todo', dueDate: '', assignee: '', assigneeId: undefined });
  };

  const getAssigneeName = (assigneeId?: number) => {
    if (!assigneeId) return '';
    const member = teamMembers.find(m => m.user.id === assigneeId);
    return member ? (member.user.full_name || member.user.first_name || member.user.email) : '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <h3 className="font-serif text-xl mb-2" style={{ color: 'var(--color-text-primary)' }}>Failed to load tasks</h3>
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-theme-primary mb-2">Tasks</h1>
          <p className="text-theme-secondary">Manage and track your team's tasks and progress.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus size={18} /> Add Task
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-serif font-bold text-theme-primary">{todoTasks.length}</div>
          <div className="text-sm text-theme-secondary">To Do</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-serif font-bold text-theme-warning">{inProgressTasks.length}</div>
          <div className="text-sm text-theme-secondary">In Progress</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-serif font-bold text-theme-success">{completedTasks.length}</div>
          <div className="text-sm text-theme-secondary">Completed</div>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'todo', 'in_progress', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as typeof filterStatus)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === status
                ? 'bg-theme-primary text-white'
                : 'bg-theme-surface text-theme-secondary hover:bg-theme-surface-elevated border border-theme-light'
            }`}
          >
            {status === 'all' ? 'All Tasks' : statusConfig[status as Task['status']].label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const config = statusConfig[task.status];
          const StatusIcon = config.icon;
          return (
            <Card
              key={task.id}
              variant="elevated"
              className="flex items-start gap-4 cursor-pointer hover:shadow-medium transition-shadow group"
              onClick={() => isAdmin && handleEdit(task)}
            >
              <button
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  const nextStatus: Task['status'] =
                    task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'completed' : 'todo';
                  handleStatusChange(task.id, nextStatus);
                }}
                className={`mt-1 ${config.color} hover:opacity-70 transition-opacity`}
                title={`Click to change status to ${task.status === 'todo' ? 'In Progress' : task.status === 'in_progress' ? 'Completed' : 'To Do'}`}
              >
                <StatusIcon size={22} strokeWidth={1.5} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      className={`font-medium text-lg ${
                        task.status === 'completed' ? 'text-theme-tertiary line-through' : 'text-theme-primary'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <p className="text-sm text-theme-secondary mt-1">{task.description}</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleDelete(task.id);
                      }}
                      className="p-2 text-theme-tertiary hover:text-theme-error hover:bg-theme-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${task.status === 'todo' ? 'text-white' : config.color} font-medium`}>
                    {config.label}
                  </span>
                  {task.link && (
                    <a
                      href={task.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-theme-primary hover:text-theme-accent transition-colors"
                    >
                      <Link2 size={12} />
                      View Link
                      <ExternalLink size={10} />
                    </a>
                  )}
                  <span className="text-xs text-theme-tertiary flex items-center gap-1">
                    <Calendar size={12} /> {task.dueDate}
                  </span>
                  {task.assignee && (
                    <span className="text-xs text-theme-tertiary">{task.assignee}</span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-theme-surface-elevated rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-theme-tertiary" />
          </div>
          <h3 className="font-serif text-xl text-theme-primary mb-2">No tasks found</h3>
          <p className="text-theme-secondary">
            {filterStatus !== 'all'
              ? 'No tasks with this status.'
              : isAdmin
              ? 'Create your first task to get started.'
              : 'No tasks have been created yet.'}
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface rounded-xl shadow-elevated w-full max-w-md border border-theme-light">
            <div className="flex items-center justify-between p-6 border-b border-theme-light">
              <h2 className="text-xl font-serif font-semibold text-theme-primary">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h2>
              <button onClick={closeModal} className="p-2 text-theme-tertiary hover:text-theme-primary rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Task Title"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What needs to be done?"
                required
              />
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add more details..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-theme-light bg-theme-background text-theme-primary placeholder:text-theme-tertiary focus:outline-none focus:ring-2 focus:ring-theme-primary/50 focus:border-theme-primary transition-all resize-none"
                />
              </div>
              <Input
                label="Link (Optional)"
                type="url"
                value={formData.link}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://example.com"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                    className="w-full px-4 py-2.5 rounded-lg border border-theme-light bg-theme-background text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/50 focus:border-theme-primary transition-all"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <Input
                  label="Due Date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1.5">Assignee</label>
                {isLoadingMembers ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-theme-light bg-theme-background">
                    <Loader2 size={16} className="animate-spin text-theme-tertiary" />
                    <span className="text-sm text-theme-tertiary">Loading team members...</span>
                  </div>
                ) : (
                  <select
                    value={formData.assigneeId || ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const memberId = e.target.value ? parseInt(e.target.value) : undefined;
                      const member = teamMembers.find(m => m.user.id === memberId);
                      setFormData({
                        ...formData,
                        assigneeId: memberId,
                        assignee: member ? (member.user.full_name || member.user.first_name || member.user.email) : '',
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border border-theme-light bg-theme-background text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/50 focus:border-theme-primary transition-all"
                  >
                    <option value="">Select a team member</option>
                    {teamMembers.map((member) => (
                      <option key={member.user.id} value={member.user.id}>
                        {member.user.full_name || member.user.first_name || member.user.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      {editingTask ? 'Saving...' : 'Adding...'}
                    </>
                  ) : (
                    editingTask ? 'Save Changes' : 'Add Task'
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
