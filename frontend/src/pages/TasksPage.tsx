import { useState, useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks';
import { api } from '@/api';
import { Plus, CheckCircle2, Circle, Clock, Trash2, X, Calendar, ExternalLink, Link2, Loader2, BookmarkPlus, Copy, Archive } from 'lucide-react';

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
  status: 'todo' | 'in_progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  assignee: number | null;
  assignee_name: string | null;
  created_by: number;
  created_by_name: string;
  parent_task: number | null;
  subtasks: ApiTask[];
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  archived_at: string | null;
}

interface Task {
  id: number;
  title: string;
  description: string;
  link?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'archived';
  dueDate: string;
  assignee: string;
  assigneeId?: number;
  parentTaskId?: number | null;
  subtasks?: Task[];
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const statusConfig = {
  todo: { label: 'To Do', icon: Circle, borderColor: 'border-black', bg: 'bg-theme-surface-elevated' },
  in_progress: { label: 'In Progress', icon: Circle, borderColor: 'border-yellow-500', bg: 'bg-theme-warning/10' },
  completed: { label: 'Completed', icon: CheckCircle2, borderColor: 'border-green-500', bg: 'bg-theme-success/10' },
  archived: { label: 'Archived', icon: Archive, borderColor: 'border-gray-500', bg: 'bg-gray-100' },
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
    parentTaskId: undefined as number | undefined,
  });
  const [filterStatus, setFilterStatus] = useState<'all' | Task['status']>('all');
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [taskToSaveAsTemplate, setTaskToSaveAsTemplate] = useState<Task | null>(null);
  const [templateName, setTemplateName] = useState('');

  // Helper function to format date safely
  const formatDate = (dateString: string | null | undefined): string | null => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return dateString;
    } catch {
      return null;
    }
  };

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
      parentTaskId: apiTask.parent_task || undefined,
      subtasks: apiTask.subtasks ? apiTask.subtasks.map(convertApiTaskToTask) : undefined,
      startedAt: formatDate(apiTask.started_at) || undefined,
      archivedAt: formatDate(apiTask.archived_at) || undefined,
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

  // Fetch templates
  useEffect(() => {
    async function fetchTemplates() {
      setIsLoadingTemplates(true);
      try {
        const token = await getToken?.();
        const response = await api.get<PaginatedResponse<any>>('/task-templates/', token || undefined);
        setTemplates(response.results || []);
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      } finally {
        setIsLoadingTemplates(false);
      }
    }
    if (isAdmin) {
      fetchTemplates();
    }
  }, [getToken, isAdmin]);

  // Helper function to recursively get all tasks including subtasks
  const getAllTasksFlat = (taskList: Task[]): Task[] => {
    const all: Task[] = [];
    taskList.forEach(task => {
      all.push(task);
      if (task.subtasks && task.subtasks.length > 0) {
        all.push(...task.subtasks);
      }
    });
    return all;
  };

  // Filter tasks - only top-level tasks (subtasks are displayed nested within their parents)
  // By default, exclude archived tasks unless filterStatus is 'archived'
  const filteredTasks = (filterStatus === 'all' 
    ? tasks.filter((t) => t.status !== 'archived') 
    : tasks.filter((t) => t.status === filterStatus))
    .filter((t) => !t.parentTaskId); // Only show top-level tasks in the main list
  
  // For stats, count pending tasks:
  // - If a task has subtasks, count only the subtasks (not the parent)
  // - If a task has no subtasks, count the task itself
  // Pending = todo + in_progress (exclude completed)
  const countPendingTasks = (): number => {
    let count = 0;
    tasks.forEach(task => {
      if (task.subtasks && task.subtasks.length > 0) {
        // Task has subtasks: count only the subtasks
        task.subtasks.forEach(subtask => {
          if (subtask.status === 'todo' || subtask.status === 'in_progress') {
            count++;
          }
        });
      } else {
        // Task has no subtasks: count the task itself
        if (task.status === 'todo' || task.status === 'in_progress') {
          count++;
        }
      }
    });
    return count;
  };
  
  const pendingTasksCount = countPendingTasks();

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
        parent_task: formData.parentTaskId || null,
      };

      if (editingTask) {
        // Update existing task
        const updated = await api.patch<ApiTask>(
          `/tasks/${editingTask.id}/`,
          taskData,
          token || undefined
        );
        // Refresh tasks to get updated structure
        const refreshResponse = await api.get<PaginatedResponse<ApiTask>>('/tasks/', token || undefined);
        const convertedTasks = (refreshResponse.results || []).map(convertApiTaskToTask);
        setTasks(convertedTasks);
      } else {
        // Create new task
        const created = await api.post<ApiTask>(
          '/tasks/',
          taskData,
          token || undefined
        );
        
        // If this is a subtask and parent task is completed, change parent to in_progress
        if (formData.parentTaskId) {
          const parentTask = tasks.find(t => t.id === formData.parentTaskId);
          if (parentTask && parentTask.status === 'completed') {
            try {
              await api.patch<ApiTask>(
                `/tasks/${parentTask.id}/update_status/`,
                { status: 'in_progress' },
                token || undefined
              );
            } catch (err) {
              console.error('Failed to update parent task status:', err);
              // Continue even if parent update fails
            }
          }
        }
        
        // Refresh tasks to get updated structure with subtasks
        const refreshResponse = await api.get<PaginatedResponse<ApiTask>>('/tasks/', token || undefined);
        const convertedTasks = (refreshResponse.results || []).map(convertApiTaskToTask);
        setTasks(convertedTasks);
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
      parentTaskId: task.parentTaskId,
    });
    setIsModalOpen(true);
  };

  const handleCreateSubtask = (parentTask: Task) => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      link: '',
      status: 'todo',
      dueDate: '',
      assignee: '',
      assigneeId: undefined,
      parentTaskId: parentTask.id,
    });
    setIsModalOpen(true);
  };

  const handleStatusChange = async (taskId: number, newStatus: Task['status']) => {
    try {
      const token = await getToken?.();
      
      // Find the task being updated (check both top-level tasks and subtasks)
      let taskToUpdate: Task | undefined;
      let parentTask: Task | undefined;
      
      for (const task of tasks) {
        if (task.id === taskId) {
          taskToUpdate = task;
          break;
        }
        if (task.subtasks) {
          const subtask = task.subtasks.find(st => st.id === taskId);
          if (subtask) {
            taskToUpdate = subtask;
            parentTask = task;
            break;
          }
        }
      }
      
      // Use the update_status endpoint which allows all users to change status
      await api.patch<ApiTask>(
        `/tasks/${taskId}/update_status/`,
        { status: newStatus },
        token || undefined
      );
      
      // If this is a top-level task being marked as completed, mark all subtasks as completed
      if (!taskToUpdate?.parentTaskId && newStatus === 'completed' && taskToUpdate?.subtasks && taskToUpdate.subtasks.length > 0) {
        // Mark all subtasks as completed
        const subtaskUpdatePromises = taskToUpdate.subtasks
          .filter(subtask => subtask.status !== 'completed')
          .map(subtask =>
            api.patch<ApiTask>(
              `/tasks/${subtask.id}/update_status/`,
              { status: 'completed' },
              token || undefined
            ).catch(err => {
              console.error(`Failed to update subtask ${subtask.id} status:`, err);
              return null;
            })
          );
        
        await Promise.all(subtaskUpdatePromises);
      }
      
      // If this is a subtask, handle parent task status updates
      if (taskToUpdate?.parentTaskId && parentTask) {
        if (newStatus === 'completed') {
          // Subtask is being marked as completed - check if all subtasks are now completed
          if (parentTask.subtasks && parentTask.subtasks.length > 0) {
            const allSubtasksCompleted = parentTask.subtasks.every(
              subtask => subtask.id === taskId || subtask.status === 'completed'
            );
            
            // If all subtasks are completed, mark parent as completed
            if (allSubtasksCompleted && parentTask.status !== 'completed') {
              try {
                await api.patch<ApiTask>(
                  `/tasks/${parentTask.id}/update_status/`,
                  { status: 'completed' },
                  token || undefined
                );
              } catch (err) {
                console.error('Failed to update parent task status:', err);
                // Continue even if parent update fails
              }
            }
          }
        } else if (taskToUpdate.status === 'completed' && newStatus !== 'completed') {
          // Subtask is being changed from completed back to todo/in_progress
          // If parent is completed, change it back to in_progress
          if (parentTask.status === 'completed') {
            try {
              await api.patch<ApiTask>(
                `/tasks/${parentTask.id}/update_status/`,
                { status: 'in_progress' },
                token || undefined
              );
            } catch (err) {
              console.error('Failed to update parent task status:', err);
              // Continue even if parent update fails
            }
          }
        }
      }
      
      // Refresh tasks to get updated structure
      const refreshResponse = await api.get<PaginatedResponse<ApiTask>>('/tasks/', token || undefined);
      const convertedTasks = (refreshResponse.results || []).map(convertApiTaskToTask);
      setTasks(convertedTasks);
    } catch (err) {
      console.error('Failed to update task status:', err);
      alert(err instanceof Error ? err.message : 'Failed to update task status');
    }
  };

  const handleArchive = async (id: number) => {
    try {
      const token = await getToken?.();
      await api.patch<ApiTask>(
        `/tasks/${id}/update_status/`,
        { status: 'archived' },
        token || undefined
      );
      // Refresh tasks to get updated structure
      const refreshResponse = await api.get<PaginatedResponse<ApiTask>>('/tasks/', token || undefined);
      const convertedTasks = (refreshResponse.results || []).map(convertApiTaskToTask);
      setTasks(convertedTasks);
    } catch (err) {
      console.error('Failed to archive task:', err);
      alert(err instanceof Error ? err.message : 'Failed to archive task');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task? This will also delete all subtasks.')) return;
    
    try {
      const token = await getToken?.();
      await api.delete(`/tasks/${id}/`, token || undefined);
      // Refresh tasks to get updated structure
      const refreshResponse = await api.get<PaginatedResponse<ApiTask>>('/tasks/', token || undefined);
      const convertedTasks = (refreshResponse.results || []).map(convertApiTaskToTask);
      setTasks(convertedTasks);
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const handleSaveAsTemplate = async (task: Task) => {
    // Prevent saving archived tasks as templates
    if (task.status === 'archived') {
      alert('Cannot save archived tasks as templates.');
      return;
    }
    setTaskToSaveAsTemplate(task);
    setTemplateName(task.title);
    setIsSaveTemplateModalOpen(true);
  };

  const handleConfirmSaveTemplate = async () => {
    if (!taskToSaveAsTemplate || !templateName.trim()) return;
    
    // Prevent saving archived tasks as templates
    if (taskToSaveAsTemplate.status === 'archived') {
      alert('Cannot save archived tasks as templates.');
      setIsSaveTemplateModalOpen(false);
      setTaskToSaveAsTemplate(null);
      setTemplateName('');
      return;
    }
    
    try {
      const token = await getToken?.();
      await api.post(`/tasks/${taskToSaveAsTemplate.id}/save_as_template/`, { name: templateName }, token || undefined);
      setIsSaveTemplateModalOpen(false);
      setTaskToSaveAsTemplate(null);
      setTemplateName('');
      
      // Refresh templates
      const response = await api.get<PaginatedResponse<any>>('/task-templates/', token || undefined);
      setTemplates(response.results || []);
    } catch (err) {
      console.error('Failed to save template:', err);
      alert(err instanceof Error ? err.message : 'Failed to save template');
    }
  };

  const handleUseTemplate = async (templateId: number) => {
    try {
      const token = await getToken?.();
      const created = await api.post<ApiTask>(`/task-templates/${templateId}/create_task_from_template/`, {}, token || undefined);
      
      // Refresh tasks
      const refreshResponse = await api.get<PaginatedResponse<ApiTask>>('/tasks/', token || undefined);
      const convertedTasks = (refreshResponse.results || []).map(convertApiTaskToTask);
      setTasks(convertedTasks);
      
      setIsModalOpen(false);
      alert('Task created from template successfully!');
    } catch (err) {
      console.error('Failed to create task from template:', err);
      alert(err instanceof Error ? err.message : 'Failed to create task from template');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setFormData({ title: '', description: '', link: '', status: 'todo', dueDate: '', assignee: '', assigneeId: undefined, parentTaskId: undefined });
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
      <div className="grid grid-cols-1 gap-4 max-w-xs">
        <Card className="text-center">
          <div className="text-3xl font-serif font-bold text-theme-primary">{pendingTasksCount}</div>
          <div className="text-sm text-theme-secondary">Pending Tasks</div>
        </Card>
      </div>

      {/* Templates Section */}
      {isAdmin && templates.length > 0 && (
        <div>
          <h2 className="text-xl font-serif font-semibold text-theme-primary mb-3">Saved Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} variant="elevated" className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-theme-primary mb-1">{template.name}</h3>
                    <p className="text-sm text-theme-secondary mb-2">{template.title}</p>
                    {template.subtasks && template.subtasks.length > 0 && (
                      <p className="text-xs text-theme-tertiary">
                        {template.subtasks.length} subtask{template.subtasks.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      handleUseTemplate(template.id);
                    }}
                    className="gap-1"
                  >
                    <Copy size={14} />
                    Use
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'todo', 'in_progress', 'completed', 'archived'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as typeof filterStatus)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === status
                ? 'text-white'
                : 'bg-theme-surface text-theme-secondary hover:bg-theme-surface-elevated border border-theme-light'
            }`}
            style={filterStatus === status ? { backgroundColor: '#000000' } : {}}
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
          const renderTask = (taskItem: Task, isSubtask = false, subtasks?: Task[]) => {
            const taskConfig = statusConfig[taskItem.status];
            const TaskStatusIcon = taskConfig.icon;
            return (
            <Card
              key={taskItem.id}
              variant="elevated"
              className={`flex items-start gap-4 cursor-pointer hover:shadow-medium transition-shadow group ${isSubtask ? 'ml-8 border-l-2 border-theme-primary/30' : ''}`}
              onClick={() => isAdmin && handleEdit(taskItem)}
            >
              <button
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  let nextStatus: Task['status'];
                  if (taskItem.status === 'archived') {
                    nextStatus = 'todo';
                  } else {
                    nextStatus = taskItem.status === 'todo' ? 'in_progress' : taskItem.status === 'in_progress' ? 'completed' : 'todo';
                  }
                  handleStatusChange(taskItem.id, nextStatus);
                }}
                className={`mt-1 hover:opacity-70 transition-opacity`}
                title={taskItem.status === 'archived' 
                  ? 'Click to unarchive (set to To Do)' 
                  : `Click to change status to ${taskItem.status === 'todo' ? 'In Progress' : taskItem.status === 'in_progress' ? 'Completed' : 'To Do'}`}
              >
                <div className={`border-2 rounded-full ${taskConfig.borderColor} ${taskItem.status === 'completed' ? 'bg-green-500' : taskItem.status === 'archived' ? 'bg-gray-500' : 'bg-transparent'}`} style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {taskItem.status === 'completed' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                  {taskItem.status === 'archived' && (
                    <Archive size={12} className="text-white" />
                  )}
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      className={`font-medium ${isSubtask ? 'text-base' : 'text-lg'} ${
                        taskItem.status === 'completed' || taskItem.status === 'archived' ? 'text-theme-tertiary line-through' : 'text-theme-primary'
                      }`}
                    >
                      {taskItem.title}
                    </h3>
                    {taskItem.description && (
                      <p className="text-sm text-theme-secondary mt-1">{taskItem.description}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      {!isSubtask && taskItem.status !== 'archived' && (
                        <button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleArchive(taskItem.id);
                          }}
                          className="p-2 text-theme-tertiary hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Archive task"
                        >
                          <Archive size={16} />
                        </button>
                      )}
                      {!isSubtask && taskItem.status !== 'archived' && (
                        <button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleSaveAsTemplate(taskItem);
                          }}
                          className="p-2 text-theme-tertiary hover:text-theme-primary hover:bg-theme-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Save as template"
                        >
                          <BookmarkPlus size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleDelete(taskItem.id);
                        }}
                        className="p-2 text-theme-tertiary hover:text-theme-error hover:bg-theme-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  {taskItem.status !== 'todo' && (
                    <span className={`text-xs px-2 py-1 rounded-full ${taskConfig.bg} ${
                      taskItem.status === 'in_progress' ? 'text-yellow-600' 
                      : taskItem.status === 'completed' ? 'text-green-600'
                      : taskItem.status === 'archived' ? 'text-gray-600'
                      : ''
                    } font-medium`}>
                      {taskConfig.label}
                    </span>
                  )}
                  {taskItem.link && (
                    <a
                      href={taskItem.link}
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
                  {taskItem.dueDate && (
                    <span className="text-xs text-theme-tertiary flex items-center gap-1">
                      <Calendar size={12} /> Due: {taskItem.dueDate}
                    </span>
                  )}
                  {taskItem.startedAt && (
                    <span className="text-xs text-theme-tertiary flex items-center gap-1" title={`Started on ${new Date(taskItem.startedAt).toLocaleString()}`}>
                      <Clock size={12} /> Started: {new Date(taskItem.startedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {taskItem.archivedAt && (
                    <span className="text-xs text-theme-tertiary flex items-center gap-1" title={`Archived on ${new Date(taskItem.archivedAt).toLocaleString()}`}>
                      <Archive size={12} /> Archived: {new Date(taskItem.archivedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {taskItem.assignee && (
                    <span className="text-xs text-theme-tertiary">{taskItem.assignee}</span>
                  )}
                </div>
                {/* Subtasks checklist */}
                {!isSubtask && subtasks && subtasks.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-theme-light">
                    <div className="space-y-2">
                      {subtasks.map((subtask) => {
                        const subtaskConfig = statusConfig[subtask.status];
                        return (
                          <div
                            key={subtask.id}
                            className="flex items-start gap-3 group/subtask"
                          >
                            <button
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                const nextStatus: Task['status'] = subtask.status === 'completed' ? 'todo' : 'completed';
                                handleStatusChange(subtask.id, nextStatus);
                              }}
                              className="mt-0.5 flex-shrink-0 hover:opacity-70 transition-opacity"
                              title={subtask.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
                            >
                              <div className={`border-2 rounded-full ${subtaskConfig.borderColor} ${subtask.status === 'completed' ? 'bg-green-500' : 'bg-transparent'}`} style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {subtask.status === 'completed' && (
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                )}
                              </div>
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <span
                                  className={`text-sm ${subtask.status === 'completed' ? 'text-theme-tertiary line-through' : 'text-theme-secondary'}`}
                                >
                                  {subtask.title}
                                </span>
                                {isAdmin && (
                                  <button
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      handleDelete(subtask.id);
                                    }}
                                    className="p-1 text-theme-tertiary hover:text-theme-error hover:bg-theme-error/10 rounded transition-colors opacity-0 group-hover/subtask:opacity-100"
                                    title="Delete subtask"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                              {subtask.description && (
                                <p className={`text-xs mt-0.5 ${subtask.status === 'completed' ? 'text-theme-tertiary line-through' : 'text-theme-tertiary'}`}>
                                  {subtask.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Add subtask button */}
                {!isSubtask && isAdmin && (
                  <div className="mt-3 pt-3 border-t border-theme-light">
                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleCreateSubtask(taskItem);
                      }}
                      className="flex items-center gap-2 text-sm text-theme-primary hover:text-theme-accent transition-colors"
                    >
                      <Plus size={16} />
                      Add subtask
                    </button>
                  </div>
                )}
              </div>
            </Card>
            );
          };
          return (
            <div key={task.id}>
              {renderTask(task, false, task.subtasks)}
            </div>
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

      {/* Save Template Modal */}
      {isSaveTemplateModalOpen && taskToSaveAsTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface rounded-xl shadow-elevated w-full max-w-md border border-theme-light">
            <div className="flex items-center justify-between p-6 border-b border-theme-light">
              <h2 className="text-xl font-serif font-semibold text-theme-primary">Save as Template</h2>
              <button onClick={() => { setIsSaveTemplateModalOpen(false); setTaskToSaveAsTemplate(null); setTemplateName(''); }} className="p-2 text-theme-tertiary hover:text-theme-primary rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Input
                label="Template Name"
                value={templateName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateName(e.target.value)}
                placeholder="Enter template name"
                required
              />
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsSaveTemplateModalOpen(false); setTaskToSaveAsTemplate(null); setTemplateName(''); }} className="flex-1">
                  Cancel
                </Button>
                <Button type="button" onClick={handleConfirmSaveTemplate} className="flex-1" disabled={!templateName.trim()}>
                  Save Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface rounded-xl shadow-elevated w-full max-w-md border border-theme-light">
            <div className="flex items-center justify-between p-6 border-b border-theme-light">
              <h2 className="text-xl font-serif font-semibold text-theme-primary">
                {editingTask ? 'Edit Task' : formData.parentTaskId ? 'Add Subtask to Task' : 'Add New Task'}
              </h2>
              <button onClick={closeModal} className="p-2 text-theme-tertiary hover:text-theme-primary rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editingTask && !formData.parentTaskId && templates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1.5">Use Template (Optional)</label>
                  <select
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      if (e.target.value) {
                        handleUseTemplate(parseInt(e.target.value));
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border border-theme-light bg-theme-background text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/50 focus:border-theme-primary transition-all"
                  >
                    <option value="">Select a template...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-theme-tertiary mt-1.5">
                    Select a template to create a task with predefined subtasks
                  </p>
                </div>
              )}
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
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <Input
                  label="Due Date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              {!editingTask && (
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1.5">Add to Parent Task (Optional)</label>
                  <select
                    value={formData.parentTaskId || ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      setFormData({
                        ...formData,
                        parentTaskId: e.target.value ? parseInt(e.target.value) : undefined,
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border border-theme-light bg-theme-background text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/50 focus:border-theme-primary transition-all"
                  >
                    <option value="">Create as top-level task</option>
                    {tasks.filter(t => !t.parentTaskId).map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                  {formData.parentTaskId && (
                    <p className="text-xs text-theme-tertiary mt-1.5">
                      This will be added as a subtask (checklist item) to the selected task
                    </p>
                  )}
                </div>
              )}
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
