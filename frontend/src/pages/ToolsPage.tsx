import { useState, useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks';
import { api } from '@/api';
import { Plus, ExternalLink, Pencil, Trash2, X, Wrench, Loader2, AlertCircle, Star } from 'lucide-react';

interface Tool {
  id: number;
  name: string;
  url: string;
  description: string;
  category: string;
  is_active: boolean;
  is_favorite?: boolean;
  created_at: string;
  created_by?: number; // User ID who created this tool
  is_personal?: boolean; // Whether this is a personal tool
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const categories = ['All', 'communication', 'productivity', 'design', 'development', 'project_management', 'other'];

const categoryLabels: Record<string, string> = {
  'All': 'All',
  'communication': 'Communication',
  'productivity': 'Productivity',
  'design': 'Design',
  'development': 'Development',
  'project_management': 'Project Management',
  'other': 'Other',
};

export function ToolsPage() {
  console.log('ToolsPage rendering');
  
  const { getToken } = useClerkAuth();
  const { isAdmin, backendUser } = useAuth();
  
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', url: '', description: '', category: 'productivity' });

  // Fetch tools from API
  useEffect(() => {
    async function fetchTools() {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getToken?.();
        const response = await api.get<PaginatedResponse<Tool>>('/tools/', token || undefined);
        setTools(response.results || []);
      } catch (err) {
        console.error('Failed to fetch tools:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tools');
      } finally {
        setIsLoading(false);
      }
    }
    fetchTools();
  }, [getToken]);

  const filteredTools = selectedCategory === 'All'
    ? tools
    : tools.filter((tool) => tool.category === selectedCategory);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = await getToken?.();
      
      if (editingTool) {
        // Update existing tool
        const updated = await api.patch<Tool>(
          `/tools/${editingTool.id}/`,
          formData,
          token || undefined
        );
        setTools(tools.map((t) => (t.id === editingTool.id ? updated : t)));
      } else {
        // Create new tool
        const created = await api.post<Tool>('/tools/', formData, token || undefined);
        setTools([...tools, created]);
      }
      closeModal();
    } catch (err) {
      console.error('Failed to save tool:', err);
      let errorMessage = 'Failed to save tool';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        // Try to extract more detailed error from the message
        try {
          const errorObj = JSON.parse(errorMessage);
          if (errorObj.detail) {
            errorMessage = errorObj.detail;
          } else if (errorObj.message) {
            errorMessage = errorObj.message;
          } else if (typeof errorObj === 'object') {
            // Handle validation errors
            const errors = Object.entries(errorObj)
              .map(([field, msg]) => `${field}: ${Array.isArray(msg) ? msg.join(', ') : msg}`)
              .join('\n');
            if (errors) {
              errorMessage = errors;
            }
          }
        } catch {
          // If parsing fails, use the original message
        }
      }
      
      console.error('Full error details:', err);
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setFormData({ name: tool.name, url: tool.url, description: tool.description, category: tool.category });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;
    
    try {
      const token = await getToken?.();
      await api.delete(`/tools/${id}/`, token || undefined);
      setTools(tools.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Failed to delete tool:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete tool');
    }
  };

  const handleToggleFavorite = async (toolId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = await getToken?.();
      const response = await api.post<{ is_favorite: boolean }>(`/tools/${toolId}/toggle_favorite/`, {}, token || undefined);
      setTools(tools.map((t) => (t.id === toolId ? { ...t, is_favorite: response.is_favorite } : t)));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      alert(err instanceof Error ? err.message : 'Failed to toggle favorite');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTool(null);
    setFormData({ name: '', url: '', description: '', category: 'productivity' });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading tools...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--color-error)', opacity: 0.2 }}>
            <AlertCircle size={32} style={{ color: 'var(--color-error)' }} />
          </div>
          <h3 className="font-serif text-xl mb-2" style={{ color: 'var(--color-text-primary)' }}>Failed to load tools</h3>
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
          <h1 className="text-3xl font-serif font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Public Tools</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Quick access to all your team's essential tools and resources.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus size={18} /> Add Tool
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: selectedCategory === category ? '#000000' : 'var(--color-surface)',
              color: selectedCategory === category ? 'white' : 'var(--color-text-secondary)',
              border: selectedCategory === category ? 'none' : '1px solid var(--color-border)',
            }}
          >
            {categoryLabels[category] || category}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool) => (
          <Card key={tool.id} variant="elevated" className="group cursor-pointer transition-all duration-200 hover:-translate-y-2 hover:shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-primary-light)' }}>
                <Wrench size={24} style={{ color: 'var(--color-primary)' }} strokeWidth={1.5} />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => handleToggleFavorite(tool.id, e)}
                  className={`p-2 rounded-lg transition-colors ${
                    tool.is_favorite
                      ? ''
                      : 'opacity-0 group-hover:opacity-100'
                  }`}
                  style={{ color: tool.is_favorite ? 'var(--color-warning)' : 'var(--color-text-tertiary)' }}
                  title={tool.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star size={18} fill={tool.is_favorite ? 'currentColor' : 'none'} />
                </button>
                {(isAdmin || (backendUser && tool.created_by === backendUser.id)) && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(tool)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(tool.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--color-error)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <h3 className="font-serif font-semibold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>{tool.name}</h3>
            <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>{tool.description}</p>
            <div className="flex items-center justify-between">
              <span 
                className="text-xs px-2 py-1 rounded-full font-medium text-white"
                style={{ backgroundColor: 'var(--color-surface-elevated)' }}
              >
                {categoryLabels[tool.category] || tool.category}
              </span>
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-medium"
                style={{ color: 'var(--color-primary)' }}
              >
                Open <ExternalLink size={14} />
              </a>
            </div>
          </Card>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--color-surface-elevated)' }}>
            <Wrench size={32} style={{ color: 'var(--color-text-tertiary)' }} />
          </div>
          <h3 className="font-serif text-xl mb-2" style={{ color: 'var(--color-text-primary)' }}>No tools found</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {isAdmin ? 'Add your first tool to get started.' : 'No tools have been added yet.'}
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-xl shadow-elevated w-full max-w-md" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h2 className="text-xl font-serif font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {editingTool ? 'Edit Tool' : 'Add New Tool'}
              </h2>
              <button onClick={closeModal} className="p-2 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Tool Name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Slack"
                required
              />
              <Input
                label="URL"
                type="url"
                value={formData.url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
                required
              />
              <Input
                label="Description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description"
              />
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: 'var(--color-surface-elevated)', 
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  {categories.filter((c) => c !== 'All').map((category) => (
                    <option key={category} value={category}>{categoryLabels[category]}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1" disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    editingTool ? 'Save Changes' : 'Add Tool'
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
