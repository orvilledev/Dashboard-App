import { useState, useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Card, Button, Input } from '@/components/ui';
import { api } from '@/api';
import { ExternalLink, Link2, Loader2, AlertCircle, Star, GripVertical, Plus, Pencil, Trash2, X, Edit2, Check, X as XIcon, Palette, LayoutGrid, List, Search } from 'lucide-react';

interface Tool {
  id: number;
  name: string;
  url: string;
  description: string;
  category: string;
  is_active: boolean;
  is_favorite?: boolean;
  is_personal?: boolean;
  created_at: string;
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

export function MyToolsPage() {
  console.log('MyToolsPage rendering');
  
  const { getToken } = useClerkAuth();
  
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', url: '', description: '', category: 'productivity' });
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [customCategoryLabels, setCustomCategoryLabels] = useState<Record<string, string>>({});
  const [customCategoryColors, setCustomCategoryColors] = useState<Record<string, string>>({});
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [dragOverCategoryIndex, setDragOverCategoryIndex] = useState<number | null>(null);
  const [editingCategoryLabel, setEditingCategoryLabel] = useState<string | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState<string>('');
  const [editingCategoryColor, setEditingCategoryColor] = useState<string | null>(null);
  const [draggedTool, setDraggedTool] = useState<Tool | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch favorite tools and user preferences from API
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getToken?.();
        
        // Fetch tools and preferences in parallel
        const [tools, preferences] = await Promise.all([
          api.get<Tool[]>('/tools/favorites/', token || undefined),
          api.get<{ tools_category_order: string[]; tools_category_labels?: Record<string, string>; tools_category_colors?: Record<string, string> }>('/users/preferences/', token || undefined).catch(() => ({ tools_category_order: [], tools_category_labels: {}, tools_category_colors: {} }))
        ]);
        
        setTools(tools);
        setCategoryOrder(preferences.tools_category_order || []);
        setCustomCategoryLabels(preferences.tools_category_labels || {});
        setCustomCategoryColors(preferences.tools_category_colors || {});
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load favorite tools');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [getToken]);

  const handleToggleFavorite = async (toolId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = await getToken?.();
      const response = await api.post<{ is_favorite: boolean }>(`/tools/${toolId}/toggle_favorite/`, {}, token || undefined);
      // Remove from list if unfavorited (only for shared tools, not personal)
      const tool = tools.find(t => t.id === toolId);
      if (!response.is_favorite && tool && !tool.is_personal) {
        setTools(tools.filter((t) => t.id !== toolId));
      } else {
        setTools(tools.map((t) => (t.id === toolId ? { ...t, is_favorite: response.is_favorite } : t)));
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      alert(err instanceof Error ? err.message : 'Failed to toggle favorite');
    }
  };

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
        closeModal();
      } else {
        // Create new personal tool - explicitly mark as personal
        const created = await api.post<Tool>('/tools/', { ...formData, is_personal: true }, token || undefined);
        console.log('Created tool:', created);
        closeModal();
        // Refresh the list to get updated data including the new tool
        try {
          const refreshedTools = await api.get<Tool[]>('/tools/favorites/', token || undefined);
          console.log('Refreshed tools:', refreshedTools);
          console.log('Created tool is_personal:', created.is_personal);
          console.log('Created tool id:', created.id);
          // Check if the created tool is in the refreshed list
          const toolInList = refreshedTools.find(t => t.id === created.id);
          if (!toolInList) {
            console.warn('Created tool not found in refreshed list, adding it manually');
            setTools([...refreshedTools, created]);
          } else {
            setTools(refreshedTools);
          }
        } catch (refreshErr) {
          // If refresh fails, at least add the created tool to the list
          console.error('Failed to refresh tools list:', refreshErr);
          setTools([...tools, created]);
        }
      }
    } catch (err) {
      console.error('Failed to save tool:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save tool';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (tool: Tool) => {
    // Only allow editing personal tools
    if (!tool.is_personal) return;
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

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTool(null);
    setFormData({ name: '', url: '', description: '', category: 'productivity' });
  };

  const handleDragStart = (index: number, tool: Tool) => {
    setDraggedIndex(index);
    setDraggedTool(tool);
  };

  const handleDragOver = (e: React.DragEvent, index: number, category?: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
      if (category) {
        setDragOverCategory(category);
      }
    }
  };

  const handleCategoryDragOver = (e: React.DragEvent, category: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedTool) {
      setDragOverCategory(category);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
    setDragOverCategory(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number, targetCategory?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex === null || !draggedTool) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setDraggedTool(null);
      setDragOverCategory(null);
      return;
    }

    // Only allow reordering when viewing all tools (not filtered)
    if (selectedCategory !== 'All') {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setDraggedTool(null);
      setDragOverCategory(null);
      return;
    }

    const draggedToolObj = tools[draggedIndex];
    const targetCategoryKey = targetCategory || draggedToolObj.category;

    // If moving to a different category, update the tool's category
    if (targetCategoryKey && targetCategoryKey !== draggedToolObj.category) {
      try {
        const token = await getToken?.();
        // Update the tool's category
        await api.patch<Tool>(
          `/tools/${draggedToolObj.id}/`,
          { category: targetCategoryKey },
          token || undefined
        );
        
        // Refresh the tools list to reflect the category change
        const refreshedTools = await api.get<Tool[]>('/tools/favorites/', token || undefined);
        setTools(refreshedTools);
      } catch (err) {
        console.error('Failed to update tool category:', err);
        alert(err instanceof Error ? err.message : 'Failed to move tool to category');
      }
    } else {
      // Same category - just reorder
      if (draggedIndex === dropIndex) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        setDraggedTool(null);
        setDragOverCategory(null);
        return;
      }

      // Reorder tools locally
      const newTools = [...tools];
      const draggedTool = newTools[draggedIndex];
      newTools.splice(draggedIndex, 1);
      newTools.splice(dropIndex, 0, draggedTool);
      setTools(newTools);

      // Update order in backend (only for favorited tools, not personal tools)
      try {
        const token = await getToken?.();
        // Only include tools that are favorited (not personal tools)
        const favoritedTools = newTools.filter(tool => !tool.is_personal);
        const orders = favoritedTools.map((tool, index) => ({
          tool_id: tool.id,
          order: index,
        }));
        
        if (orders.length > 0) {
          await api.post('/tools/reorder_favorites/', { orders }, token || undefined);
        }
      } catch (err) {
        console.error('Failed to update tool order:', err);
        // Revert on error
        setTools(tools);
        alert(err instanceof Error ? err.message : 'Failed to save tool order');
      }
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    setDraggedTool(null);
    setDragOverCategory(null);
  };

  const handleCategoryDrop = async (e: React.DragEvent, category: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedTool) {
      setDraggedTool(null);
      setDragOverCategory(null);
      return;
    }

    // Check if moving to a different category
    if (category !== draggedTool.category) {
      try {
        const token = await getToken?.();
        // Update the tool's category
        await api.patch<Tool>(
          `/tools/${draggedTool.id}/`,
          { category: category },
          token || undefined
        );
        
        // Refresh the tools list to reflect the category change
        const refreshedTools = await api.get<Tool[]>('/tools/favorites/', token || undefined);
        setTools(refreshedTools);
      } catch (err) {
        console.error('Failed to update tool category:', err);
        alert(err instanceof Error ? err.message : 'Failed to move tool to category');
      }
    }

    setDraggedTool(null);
    setDragOverCategory(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDraggedTool(null);
    setDragOverCategory(null);
  };

  // Category drag handlers (for reordering categories themselves)
  const handleCategoryDragStart = (index: number) => {
    setDraggedCategoryIndex(index);
  };

  const handleCategoryHeaderDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedCategoryIndex !== null && draggedCategoryIndex !== index) {
      setDragOverCategoryIndex(index);
    }
  };

  const handleCategoryHeaderDragLeave = () => {
    setDragOverCategoryIndex(null);
  };

  const handleCategoryHeaderDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedCategoryIndex === null || draggedCategoryIndex === dropIndex) {
      setDraggedCategoryIndex(null);
      setDragOverCategoryIndex(null);
      return;
    }

    // Reorder categories locally
    const newOrder = [...orderedCategories];
    const draggedCategory = newOrder[draggedCategoryIndex];
    newOrder.splice(draggedCategoryIndex, 1);
    newOrder.splice(dropIndex, 0, draggedCategory);
    setCategoryOrder(newOrder);

    // Save to backend
    try {
      const token = await getToken?.();
      await api.post('/users/update_preferences/', { tools_category_order: newOrder }, token || undefined);
    } catch (err) {
      console.error('Failed to save category order:', err);
      // Revert on error
      setCategoryOrder(categoryOrder);
    }

    setDraggedCategoryIndex(null);
    setDragOverCategoryIndex(null);
  };

  const handleCategoryHeaderDragEnd = () => {
    setDraggedCategoryIndex(null);
    setDragOverCategoryIndex(null);
  };

  // Get display label for a category heading (custom label or default)
  // IMPORTANT: This function only returns a display label. It does NOT modify the actual
  // category value stored on tools. Tools always keep their original category keys
  // (e.g., "productivity", "other"). This function only changes what is displayed to the user.
  // Use this for category section headings.
  const getCategoryLabel = (categoryKey: string): string => {
    if (customCategoryLabels[categoryKey]) {
      return customCategoryLabels[categoryKey];
    }
    return categoryLabels[categoryKey] || categoryKey;
  };

  // Get default category label (always returns original/default label, ignores custom labels)
  // Use this for tool card badges to ensure they always show the original category names
  const getDefaultCategoryLabel = (categoryKey: string): string => {
    return categoryLabels[categoryKey] || categoryKey;
  };

  // Handle category label edit
  // NOTE: This only edits the display label, not the actual tool.category values
  const handleCategoryLabelEdit = (categoryKey: string) => {
    setEditingCategoryLabel(categoryKey);
    setEditingCategoryValue(customCategoryLabels[categoryKey] || categoryLabels[categoryKey] || '');
  };

  // Save category label
  // IMPORTANT: This only updates the display label in user preferences.
  // It does NOT modify the category values stored on individual tools.
  // Tools retain their original category keys (e.g., "productivity", "other").
  const handleCategoryLabelSave = async (categoryKey: string) => {
    try {
      const token = await getToken?.();
      const newLabels = { ...customCategoryLabels };
      if (editingCategoryValue.trim()) {
        newLabels[categoryKey] = editingCategoryValue.trim();
      } else {
        delete newLabels[categoryKey];
      }
      
      // Only update user preferences - does NOT touch tool.category values
      await api.post('/users/update_preferences/', { 
        tools_category_labels: newLabels 
      }, token || undefined);
      
      setCustomCategoryLabels(newLabels);
      setEditingCategoryLabel(null);
      setEditingCategoryValue('');
    } catch (err) {
      console.error('Failed to save category label:', err);
      alert(err instanceof Error ? err.message : 'Failed to save category label');
    }
  };

  // Cancel category label edit
  const handleCategoryLabelCancel = () => {
    setEditingCategoryLabel(null);
    setEditingCategoryValue('');
  };

  // Handle create new group
  const handleCreateNewGroup = async () => {
    if (!newGroupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    try {
      const token = await getToken?.();
      const newLabels = { ...customCategoryLabels };
      
      // Find the first available category that doesn't have a custom label yet
      // Exclude 'All' from the list
      const availableCategories = categories.filter(cat => cat !== 'All' && !customCategoryLabels[cat]);
      
      if (availableCategories.length === 0) {
        alert('All available categories are already used. Please rename or delete an existing group to create a new one.');
        return;
      }
      
      // Use the first available category
      const categoryToUse = availableCategories[0];
      
      // Set the custom label for this category
      newLabels[categoryToUse] = newGroupName.trim();
      
      await api.post('/users/update_preferences/', { 
        tools_category_labels: newLabels 
      }, token || undefined);
      
      setCustomCategoryLabels(newLabels);
      setNewGroupName('');
      setIsNewGroupModalOpen(false);
      
      // Ensure the new group appears by adding it to categoryOrder if not already present
      if (!categoryOrder.includes(categoryToUse)) {
        const newOrder = [...categoryOrder, categoryToUse];
        setCategoryOrder(newOrder);
        try {
          await api.post('/users/update_preferences/', { 
            tools_category_order: newOrder 
          }, token || undefined);
        } catch (err) {
          console.error('Failed to update category order:', err);
        }
      }
    } catch (err) {
      console.error('Failed to create new group:', err);
      alert(err instanceof Error ? err.message : 'Failed to create new group');
    }
  };

  // Handle delete custom group (reset to default)
  const handleDeleteCustomGroup = async (categoryKey: string) => {
    const hasCustomLabel = customCategoryLabels[categoryKey];
    const hasCustomColor = customCategoryColors[categoryKey];
    
    if (!hasCustomLabel && !hasCustomColor) {
      // If no customizations, there's nothing to delete
      alert('This group is already using default settings.');
      return;
    }

    const message = hasCustomLabel && hasCustomColor 
      ? `Are you sure you want to reset the group "${getCategoryLabel(categoryKey)}" to default? This will remove the custom name and color.`
      : hasCustomLabel
      ? `Are you sure you want to reset the group name "${getCategoryLabel(categoryKey)}" to default?`
      : `Are you sure you want to reset the group color to default?`;
    
    if (!confirm(message)) {
      return;
    }

    try {
      const token = await getToken?.();
      const newLabels = { ...customCategoryLabels };
      const newColors = { ...customCategoryColors };
      
      if (hasCustomLabel) {
        delete newLabels[categoryKey];
      }
      if (hasCustomColor) {
        delete newColors[categoryKey];
      }
      
      await api.post('/users/update_preferences/', { 
        tools_category_labels: newLabels,
        tools_category_colors: newColors
      }, token || undefined);
      
      setCustomCategoryLabels(newLabels);
      setCustomCategoryColors(newColors);
    } catch (err) {
      console.error('Failed to delete group:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete group');
    }
  };

  // Preset colors for quick selection (40 colors including black and white)
  const presetColors = [
    '#000000', // Black
    '#FFFFFF', // White
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#84CC16', // Lime
    '#FBBF24', // Yellow
    '#FB923C', // Orange (lighter)
    '#F87171', // Red (lighter)
    '#A78BFA', // Violet
    '#F472B6', // Pink (lighter)
    '#60A5FA', // Blue (lighter)
    '#34D399', // Green (lighter)
    '#22D3EE', // Cyan (lighter)
    '#A855F7', // Purple (lighter)
    '#1E40AF', // Blue (darker)
    '#065F46', // Green (darker)
    '#B45309', // Amber (darker)
    '#991B1B', // Red (darker)
    '#5B21B6', // Purple (darker)
    '#9F1239', // Pink (darker)
    '#0E7490', // Cyan (darker)
    '#C2410C', // Orange (darker)
    '#7C3AED', // Indigo (medium)
    '#059669', // Emerald
    '#DC2626', // Red (vibrant)
    '#16A34A', // Green (vibrant)
    '#2563EB', // Blue (vibrant)
    '#9333EA', // Purple (vibrant)
    '#CA8A04', // Yellow (darker)
    '#0891B2', // Sky blue
    '#BE185D', // Rose
    '#7E22CE', // Violet (darker)
    '#0D9488', // Teal (darker)
  ];

  // Handle category color edit
  const handleCategoryColorEdit = (categoryKey: string) => {
    setEditingCategoryColor(categoryKey);
  };

  // Save category color
  const handleCategoryColorSave = async (categoryKey: string, color: string) => {
    try {
      const token = await getToken?.();
      const newColors = { ...customCategoryColors };
      if (color.trim()) {
        newColors[categoryKey] = color.trim();
      } else {
        delete newColors[categoryKey];
      }
      
      await api.post('/users/update_preferences/', { 
        tools_category_colors: newColors 
      }, token || undefined);
      
      setCustomCategoryColors(newColors);
      setEditingCategoryColor(null);
    } catch (err) {
      console.error('Failed to save category color:', err);
      alert(err instanceof Error ? err.message : 'Failed to save category color');
    }
  };

  // Cancel category color edit
  const handleCategoryColorCancel = () => {
    setEditingCategoryColor(null);
  };

  // Get category color (custom color or default)
  const getCategoryColor = (categoryKey: string): string => {
    return customCategoryColors[categoryKey] || 'var(--color-primary)';
  };

  // Helper function to convert hex color to rgba with opacity
  const hexToRgba = (hex: string, opacity: number): string => {
    // Handle CSS variables
    if (hex.startsWith('var(--')) {
      return hex; // Return as-is for CSS variables, will need fallback
    }
    
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Get category color with opacity for backgrounds
  const getCategoryColorWithOpacity = (categoryKey: string, opacity: number): string => {
    const color = customCategoryColors[categoryKey];
    if (!color) {
      return `var(--color-primary-light)`; // Fallback to CSS variable
    }
    return hexToRgba(color, opacity);
  };

  const filteredTools = selectedCategory === 'All'
    ? tools
    : tools.filter((tool) => tool.category === selectedCategory);

  // Filter tools based on search query
  const filteredToolsBySearch = searchQuery.trim()
    ? tools.filter((tool) => {
        const query = searchQuery.toLowerCase().trim();
        const toolName = tool.name.toLowerCase();
        const toolDescription = tool.description?.toLowerCase() || '';
        const toolCategory = getCategoryLabel(tool.category).toLowerCase();
        const toolCategoryKey = tool.category.toLowerCase();
        
        return (
          toolName.includes(query) ||
          toolDescription.includes(query) ||
          toolCategory.includes(query) ||
          toolCategoryKey.includes(query)
        );
      })
    : tools;

  // Group tools by category
  const groupedTools = filteredToolsBySearch.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

  // Ensure categories with custom labels have an empty array if they have no tools
  Object.keys(customCategoryLabels).forEach(catKey => {
    if (!groupedTools[catKey]) {
      groupedTools[catKey] = [];
    }
  });

  // Get categories that have tools OR have custom labels (to show empty groups)
  // When searching, only show categories that have matching tools
  const categoriesWithTools = categories.filter(cat => {
    if (cat === 'All') return false;
    // Show category if it has tools (matching search) OR if it has a custom label (and not searching)
    const hasTools = groupedTools[cat] && groupedTools[cat].length > 0;
    const hasCustomLabel = customCategoryLabels[cat] !== undefined;
    return hasTools || (hasCustomLabel && !searchQuery.trim());
  });
  
  // Apply custom order if user has set one
  const orderedCategories = categoryOrder.length > 0
    ? [
        ...categoryOrder.filter(cat => categoriesWithTools.includes(cat)),
        ...categoriesWithTools.filter(cat => !categoryOrder.includes(cat))
      ]
    : categoriesWithTools;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading your favorite tools...</p>
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
          <h3 className="font-serif text-xl mb-2" style={{ color: 'var(--color-text-primary)' }}>Failed to load favorite tools</h3>
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
        <div className="flex-1">
          <h1 className="text-3xl font-serif font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>My Tools</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Your starred tools and custom personal tools for quick access.</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative" style={{ width: '300px' }}>
            <Search 
              size={18} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2" 
              style={{ color: 'white' }} 
            />
            <input
              type="text"
              placeholder="Search for a tool."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors placeholder:text-white/70"
              style={{
                backgroundColor: 'var(--color-surface-elevated)',
                borderColor: 'var(--color-border)',
                color: 'white',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors"
                style={{ color: 'var(--color-text-tertiary)' }}
                title="Clear search"
              >
                <XIcon size={16} />
              </button>
            )}
          </div>
          <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-all ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : 'opacity-60 hover:opacity-100'
              }`}
              style={{ color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
              title="Grid view"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'opacity-60 hover:opacity-100'
              }`}
              style={{ color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
              title="List view"
            >
              <List size={18} />
            </button>
          </div>
          <Button 
            onClick={() => setIsNewGroupModalOpen(true)} 
            variant="outline"
            className="gap-2"
          >
            <Plus size={18} /> New Group
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus size={18} /> Add Custom Tool
          </Button>
        </div>
      </div>

      {/* Tools Grouped by Category */}
      {orderedCategories.length > 0 ? (
        <div className="space-y-10">
          {orderedCategories.map((category, categoryIndex) => (
            <div 
              key={category} 
              className={`space-y-4 group ${
                draggedCategoryIndex === categoryIndex ? 'opacity-50' : ''
              } ${
                dragOverCategoryIndex === categoryIndex ? 'ring-2 ring-blue-400 ring-offset-4 rounded-lg' : ''
              } transition-all`}
            >
              {/* Category Heading with drag handle */}
              <div
                className="transition-colors rounded-lg"
                style={{ backgroundColor: dragOverCategoryIndex === categoryIndex ? 'var(--color-primary-light)' : 'transparent' }}
                onDragOver={(e) => handleCategoryHeaderDragOver(e, categoryIndex)}
                onDragLeave={handleCategoryHeaderDragLeave}
                onDrop={(e) => handleCategoryHeaderDrop(e, categoryIndex)}
              >
                <div 
                  className="group text-2xl font-serif font-semibold pb-2 flex items-center gap-2"
                  style={{ color: getCategoryColor(category), borderBottom: `2px solid ${getCategoryColor(category)}` }}
                >
                  <span
                    draggable={true}
                    onDragStart={(e) => {
                      e.stopPropagation();
                      handleCategoryDragStart(categoryIndex);
                    }}
                    onDragEnd={handleCategoryHeaderDragEnd}
                    className="cursor-grab active:cursor-grabbing p-1 rounded transition-colors"
                    style={{ color: 'var(--color-text-tertiary)' }}
                    title="Drag to reorder categories"
                  >
                    <GripVertical size={20} />
                  </span>
                  {editingCategoryLabel === category ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingCategoryValue}
                        onChange={(e) => setEditingCategoryValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCategoryLabelSave(category);
                          } else if (e.key === 'Escape') {
                            handleCategoryLabelCancel();
                          }
                        }}
                        className="flex-1 px-3 py-1 rounded-lg text-2xl font-serif font-semibold"
                        style={{ 
                          backgroundColor: 'var(--color-surface-elevated)', 
                          color: 'var(--color-text-primary)',
                          border: '2px solid var(--color-primary)'
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleCategoryLabelSave(category)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--color-success)', backgroundColor: 'var(--color-surface-elevated)' }}
                        title="Save"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={handleCategoryLabelCancel}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--color-error)', backgroundColor: 'var(--color-surface-elevated)' }}
                        title="Cancel"
                      >
                        <XIcon size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1">{getCategoryLabel(category)}</span>
                      <div className="flex gap-1">
                        {editingCategoryColor === category ? (
                          <div className="relative rounded-lg max-w-md" style={{ backgroundColor: 'var(--color-surface-elevated)', padding: '8px' }}>
                            <button
                              onClick={handleCategoryColorCancel}
                              className="absolute top-2 right-2 p-1 rounded transition-colors hover:bg-gray-700 z-10"
                              style={{ color: 'var(--color-text-secondary)' }}
                              title="Close"
                            >
                              <XIcon size={16} />
                            </button>
                            <div className="grid grid-cols-10 gap-1.5" style={{ paddingRight: '28px' }}>
                              {presetColors.map((color) => (
                                <button
                                  key={color}
                                  onClick={() => handleCategoryColorSave(category, color)}
                                  className="w-6 h-6 rounded border-2 shadow-sm hover:scale-110 transition-transform justify-self-start"
                                  style={{ 
                                    backgroundColor: color,
                                    borderColor: color === '#FFFFFF' ? '#E5E7EB' : 'white'
                                  }}
                                  title={`Set color to ${color}`}
                                />
                              ))}
                              <input
                                type="color"
                                value={customCategoryColors[category] || '#3B82F6'}
                                onChange={(e) => handleCategoryColorSave(category, e.target.value)}
                                className="w-6 h-6 rounded cursor-pointer border border-gray-300 justify-self-start"
                                title="Custom color"
                              />
                            </div>
                            <div className="mt-2 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                              Pick a color
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleCategoryColorEdit(category)}
                              className="p-1.5 rounded-lg transition-all opacity-60 hover:opacity-100 group-hover:opacity-100"
                              style={{ 
                                color: getCategoryColor(category),
                                backgroundColor: 'var(--color-surface-elevated)'
                              }}
                              title="Change group color"
                            >
                              <Palette size={16} />
                            </button>
                            <button
                              onClick={() => handleCategoryLabelEdit(category)}
                              className="p-1.5 rounded-lg transition-all hover:bg-gray-200"
                              style={{ 
                                color: 'var(--color-text-primary)',
                                backgroundColor: 'var(--color-surface-elevated)',
                                border: '1px solid var(--color-border)'
                              }}
                              title="Edit group name"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomGroup(category)}
                              className="p-1.5 rounded-lg transition-all hover:bg-gray-200"
                              style={{ 
                                color: 'var(--color-error)',
                                backgroundColor: 'var(--color-surface-elevated)',
                                border: '1px solid var(--color-border)'
                              }}
                              title={customCategoryLabels[category] ? "Delete custom group (reset to default)" : "Reset group to default"}
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Tools Grid/List for this category */}
              <div 
                className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' : 'flex flex-col gap-4'}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCategoryDragOver(e, category);
                }}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCategoryDrop(e, category);
                }}
                style={{
                  minHeight: dragOverCategory === category ? '100px' : ((groupedTools[category] && groupedTools[category].length === 0) ? '80px' : 'auto'),
                  backgroundColor: dragOverCategory === category ? getCategoryColorWithOpacity(category, 0.1) : 'transparent',
                  borderRadius: dragOverCategory === category ? '8px' : '0',
                  padding: dragOverCategory === category ? '8px' : '0',
                  border: (groupedTools[category] && groupedTools[category].length === 0) ? `2px dashed ${getCategoryColorWithOpacity(category, 0.3)}` : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {groupedTools[category] && groupedTools[category].length > 0 ? (
                  groupedTools[category].map((tool, index) => {
                  // Calculate the global index for drag and drop
                  const globalIndex = tools.findIndex(t => t.id === tool.id);
                  return (
                  <Card
                    key={tool.id}
                    variant="elevated"
                    className={`group relative ${
                      draggedIndex === globalIndex ? 'opacity-50' : ''
                    } ${
                      tool.is_personal ? '' : ''
                    } transition-all duration-200 cursor-move ${
                      viewMode === 'grid' ? 'hover:-translate-y-2 hover:shadow-2xl' : ''
                    }`}
                    style={{
                      border: dragOverIndex === globalIndex 
                        ? `2px solid ${getCategoryColor(category)}` 
                        : tool.is_personal 
                          ? `2px solid ${getCategoryColorWithOpacity(category, 0.3)}`
                          : 'none',
                      backgroundColor: tool.is_personal ? getCategoryColorWithOpacity(category, 0.05) : undefined,
                      boxShadow: dragOverIndex === globalIndex ? `0 0 0 2px ${getCategoryColorWithOpacity(category, 0.2)}` : undefined,
                    }}
                    draggable={true}
                    onDragStart={(e) => {
                      e.stopPropagation();
                      handleDragStart(globalIndex, tool);
                    }}
                    onDragOver={(e) => {
                      e.stopPropagation();
                      handleDragOver(e, globalIndex, category);
                    }}
                    onDragLeave={(e) => {
                      e.stopPropagation();
                      handleDragLeave();
                    }}
                    onDrop={(e) => {
                      e.stopPropagation();
                      handleDrop(e, globalIndex, category);
                    }}
                    onDragEnd={(e) => {
                      e.stopPropagation();
                      handleDragEnd();
                    }}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="p-3 rounded-lg" style={{ backgroundColor: getCategoryColorWithOpacity(category, 0.1) }}>
                              <Link2 size={24} style={{ color: getCategoryColor(category) }} strokeWidth={1.5} />
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" title="Drag to reorder">
                              <GripVertical size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!tool.is_personal && (
                              <button
                                onClick={(e) => handleToggleFavorite(tool.id, e)}
                                className="p-2 rounded-lg transition-colors z-10"
                                style={{ color: 'var(--color-warning)' }}
                                title="Remove from favorites"
                              >
                                <Star size={18} fill="currentColor" />
                              </button>
                            )}
                            {tool.is_personal && (
                              <>
                                <span className="text-xs px-2 py-1 rounded-full font-medium shadow-sm text-white whitespace-nowrap" style={{ backgroundColor: getCategoryColor(category) }}>Personal Tool</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleEdit(tool)}
                                    className="p-2 rounded-lg transition-colors z-10"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                    title="Edit tool"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(tool.id)}
                                    className="p-2 rounded-lg transition-colors z-10"
                                    style={{ color: 'var(--color-error)' }}
                                    title="Delete tool"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <h3 className="font-serif font-semibold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>
                          {tool.name}
                        </h3>
                        <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>{tool.description}</p>
                        <div className="flex items-center justify-between">
                          <span 
                            className="text-xs px-2 py-1 rounded-full font-medium text-white"
                            style={{ backgroundColor: 'var(--color-surface-elevated)' }}
                          >
                            {getDefaultCategoryLabel(tool.category)}
                          </span>
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm font-medium"
                            style={{ color: getCategoryColor(category) }}
                          >
                            Open <ExternalLink size={14} />
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" title="Drag to reorder">
                            <GripVertical size={18} style={{ color: 'var(--color-text-tertiary)' }} />
                          </div>
                          <div className="p-2 rounded-lg" style={{ backgroundColor: getCategoryColorWithOpacity(category, 0.1) }}>
                            <Link2 size={20} style={{ color: getCategoryColor(category) }} strokeWidth={1.5} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-serif font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                                {tool.name}
                              </h3>
                              {!tool.is_personal && (
                                <button
                                  onClick={(e) => handleToggleFavorite(tool.id, e)}
                                  className="p-1 rounded transition-colors"
                                  style={{ color: 'var(--color-warning)' }}
                                  title="Remove from favorites"
                                >
                                  <Star size={16} fill="currentColor" />
                                </button>
                              )}
                              {tool.is_personal && (
                                <>
                                  <span className="text-xs px-2 py-1 rounded-full font-medium text-white whitespace-nowrap" style={{ backgroundColor: getCategoryColor(category) }}>Personal Tool</span>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleEdit(tool)}
                                      className="p-1 rounded transition-colors"
                                      style={{ color: 'var(--color-text-secondary)' }}
                                      title="Edit tool"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(tool.id)}
                                      className="p-1 rounded transition-colors"
                                      style={{ color: 'var(--color-error)' }}
                                      title="Delete tool"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{tool.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span 
                            className="text-xs px-2 py-1 rounded-full font-medium text-white"
                            style={{ backgroundColor: 'var(--color-surface-elevated)' }}
                          >
                            {getDefaultCategoryLabel(tool.category)}
                          </span>
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm font-medium"
                            style={{ color: getCategoryColor(category) }}
                          >
                            Open <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    )}
                  </Card>
                  );
                  })
                ) : (
                  <div className={`${viewMode === 'grid' ? 'col-span-full' : ''} text-center py-8`} style={{ color: 'var(--color-text-tertiary)' }}>
                    <p className="text-sm">Drag tools here to add them to this group</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--color-surface-elevated)' }}>
            <Star size={32} style={{ color: 'var(--color-text-tertiary)' }} />
          </div>
          <h3 className="font-serif text-xl mb-2" style={{ color: 'var(--color-text-primary)' }}>No tools yet</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Star tools from the Tools page or add your own custom tools to get started.
          </p>
        </div>
      )}

      {/* Create New Group Modal */}
      {isNewGroupModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-xl shadow-elevated w-full max-w-md" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h2 className="text-xl font-serif font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Create New Group
              </h2>
              <button onClick={() => { setIsNewGroupModalOpen(false); setNewGroupName(''); }} className="p-2 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Group Name
                </label>
                <Input
                  value={newGroupName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGroupName(e.target.value)}
                  placeholder="e.g., My Custom Group"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNewGroup();
                    } else if (e.key === 'Escape') {
                      setIsNewGroupModalOpen(false);
                      setNewGroupName('');
                    }
                  }}
                  autoFocus
                />
                <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
                  This will create a new group. You can move tools to it by dragging them to this group.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { setIsNewGroupModalOpen(false); setNewGroupName(''); }} 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleCreateNewGroup} 
                  className="flex-1"
                  disabled={!newGroupName.trim()}
                >
                  Create Group
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-xl shadow-elevated w-full max-w-md" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h2 className="text-xl font-serif font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {editingTool ? 'Edit Custom Tool' : 'Add Custom Tool'}
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
                placeholder="e.g., My Custom Tool"
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
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Group</label>
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
                    <option key={category} value={category}>{getCategoryLabel(category)}</option>
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

