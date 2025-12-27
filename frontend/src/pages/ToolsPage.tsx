import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, Button, Input } from '@/components/ui';
import { Plus, ExternalLink, Pencil, Trash2, X, Link2 } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
}

const initialTools: Tool[] = [
  { id: '1', name: 'Slack', url: 'https://slack.com', description: 'Team communication', category: 'Communication' },
  { id: '2', name: 'Notion', url: 'https://notion.so', description: 'Notes and documentation', category: 'Productivity' },
  { id: '3', name: 'Figma', url: 'https://figma.com', description: 'Design collaboration', category: 'Design' },
  { id: '4', name: 'GitHub', url: 'https://github.com', description: 'Code repository', category: 'Development' },
  { id: '5', name: 'Linear', url: 'https://linear.app', description: 'Issue tracking', category: 'Project Management' },
  { id: '6', name: 'Loom', url: 'https://loom.com', description: 'Video messaging', category: 'Communication' },
];

const categories = ['All', 'Communication', 'Productivity', 'Design', 'Development', 'Project Management'];

export function ToolsPage() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [formData, setFormData] = useState({ name: '', url: '', description: '', category: 'Productivity' });

  const filteredTools = selectedCategory === 'All'
    ? tools
    : tools.filter((tool) => tool.category === selectedCategory);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingTool) {
      setTools(tools.map((t) => (t.id === editingTool.id ? { ...formData, id: editingTool.id } : t)));
    } else {
      setTools([...tools, { ...formData, id: Date.now().toString() }]);
    }
    closeModal();
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setFormData({ name: tool.name, url: tool.url, description: tool.description, category: tool.category });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setTools(tools.filter((t) => t.id !== id));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTool(null);
    setFormData({ name: '', url: '', description: '', category: 'Productivity' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal-900 mb-2">Tools</h1>
          <p className="text-charcoal-500">Quick access to all your team's essential tools and resources.</p>
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === category
                ? 'bg-charcoal-800 text-cream-50'
                : 'bg-white text-charcoal-600 hover:bg-cream-100 border border-charcoal-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool) => (
          <Card key={tool.id} variant="elevated" className="group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-cream-100 rounded-lg">
                <Link2 size={24} className="text-gold-600" strokeWidth={1.5} />
              </div>
              {isAdmin && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(tool)}
                    className="p-2 text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 rounded-lg transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(tool.id)}
                    className="p-2 text-charcoal-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            <h3 className="font-serif font-semibold text-lg text-charcoal-900 mb-1">{tool.name}</h3>
            <p className="text-sm text-charcoal-500 mb-3">{tool.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-1 bg-cream-100 text-charcoal-500 rounded-full">
                {tool.category}
              </span>
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700 font-medium"
              >
                Open <ExternalLink size={14} />
              </a>
            </div>
          </Card>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Link2 size={32} className="text-charcoal-300" />
          </div>
          <h3 className="font-serif text-xl text-charcoal-700 mb-2">No tools found</h3>
          <p className="text-charcoal-500">
            {isAdmin ? 'Add your first tool to get started.' : 'No tools have been added yet.'}
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-charcoal-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-elevated w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-charcoal-100">
              <h2 className="text-xl font-serif font-semibold text-charcoal-900">
                {editingTool ? 'Edit Tool' : 'Add New Tool'}
              </h2>
              <button onClick={closeModal} className="p-2 text-charcoal-400 hover:text-charcoal-600 rounded-lg">
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
                <label className="block text-sm font-medium text-charcoal-700 mb-1.5">Category</label>
                <select
                  value={formData.category}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-charcoal-200 bg-white text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                >
                  {categories.filter((c) => c !== 'All').map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingTool ? 'Save Changes' : 'Add Tool'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
