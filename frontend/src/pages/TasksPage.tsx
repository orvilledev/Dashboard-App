import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, Button, Input } from '@/components/ui';
import { Plus, CheckCircle2, Circle, Clock, Trash2, X, Calendar } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  dueDate: string;
  assignee: string;
}

const initialTasks: Task[] = [
  { id: '1', title: 'Review Q4 financial report', description: 'Go through the quarterly report and prepare summary', status: 'todo', dueDate: '2024-01-15', assignee: 'John Doe' },
  { id: '2', title: 'Update homepage design', description: 'Implement new hero section with animations', status: 'in_progress', dueDate: '2024-01-12', assignee: 'Jane Smith' },
  { id: '3', title: 'Prepare team presentation', description: 'Create slides for all-hands meeting', status: 'completed', dueDate: '2024-01-10', assignee: 'Mike Johnson' },
  { id: '4', title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated deployment', status: 'todo', dueDate: '2024-01-18', assignee: 'Sarah Wilson' },
  { id: '5', title: 'Write API documentation', description: 'Document all REST endpoints', status: 'in_progress', dueDate: '2024-01-14', assignee: 'John Doe' },
  { id: '6', title: 'User testing session', description: 'Conduct usability testing with 5 users', status: 'completed', dueDate: '2024-01-08', assignee: 'Jane Smith' },
];

const statusConfig = {
  todo: { label: 'To Do', icon: Circle, color: 'text-charcoal-400', bg: 'bg-charcoal-100' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100' },
};

export function TasksPage() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as Task['status'],
    dueDate: '',
    assignee: '',
  });
  const [filterStatus, setFilterStatus] = useState<'all' | Task['status']>('all');

  const filteredTasks = filterStatus === 'all' ? tasks : tasks.filter((t) => t.status === filterStatus);
  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingTask) {
      setTasks(tasks.map((t) => (t.id === editingTask.id ? { ...formData, id: editingTask.id } : t)));
    } else {
      setTasks([...tasks, { ...formData, id: Date.now().toString() }]);
    }
    closeModal();
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      dueDate: task.dueDate,
      assignee: task.assignee,
    });
    setIsModalOpen(true);
  };

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
  };

  const handleDelete = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setFormData({ title: '', description: '', status: 'todo', dueDate: '', assignee: '' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal-900 mb-2">Tasks</h1>
          <p className="text-charcoal-500">Manage and track your team's tasks and progress.</p>
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
          <div className="text-3xl font-serif font-bold text-charcoal-900">{todoTasks.length}</div>
          <div className="text-sm text-charcoal-500">To Do</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-serif font-bold text-amber-500">{inProgressTasks.length}</div>
          <div className="text-sm text-charcoal-500">In Progress</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-serif font-bold text-green-500">{completedTasks.length}</div>
          <div className="text-sm text-charcoal-500">Completed</div>
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
                ? 'bg-charcoal-800 text-cream-50'
                : 'bg-white text-charcoal-600 hover:bg-cream-100 border border-charcoal-200'
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
              className="flex items-start gap-4 cursor-pointer hover:shadow-medium transition-shadow"
              onClick={() => isAdmin && handleEdit(task)}
            >
              <button
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (!isAdmin) return;
                  const nextStatus: Task['status'] =
                    task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'completed' : 'todo';
                  handleStatusChange(task.id, nextStatus);
                }}
                className={`mt-1 ${config.color} hover:opacity-70 transition-opacity`}
                disabled={!isAdmin}
              >
                <StatusIcon size={22} strokeWidth={1.5} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      className={`font-medium text-lg ${
                        task.status === 'completed' ? 'text-charcoal-400 line-through' : 'text-charcoal-900'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <p className="text-sm text-charcoal-500 mt-1">{task.description}</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleDelete(task.id);
                      }}
                      className="p-2 text-charcoal-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.color} font-medium`}>
                    {config.label}
                  </span>
                  <span className="text-xs text-charcoal-400 flex items-center gap-1">
                    <Calendar size={12} /> {task.dueDate}
                  </span>
                  <span className="text-xs text-charcoal-400">{task.assignee}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-charcoal-300" />
          </div>
          <h3 className="font-serif text-xl text-charcoal-700 mb-2">No tasks found</h3>
          <p className="text-charcoal-500">
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
        <div className="fixed inset-0 bg-charcoal-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-elevated w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-charcoal-100">
              <h2 className="text-xl font-serif font-semibold text-charcoal-900">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h2>
              <button onClick={closeModal} className="p-2 text-charcoal-400 hover:text-charcoal-600 rounded-lg">
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
                <label className="block text-sm font-medium text-charcoal-700 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add more details..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-charcoal-200 bg-white text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                    className="w-full px-4 py-2.5 rounded-lg border border-charcoal-200 bg-white text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
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
              <Input
                label="Assignee"
                value={formData.assignee}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, assignee: e.target.value })}
                placeholder="Who is responsible?"
              />
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingTask ? 'Save Changes' : 'Add Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
