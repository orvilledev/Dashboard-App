import { Link } from 'react-router-dom';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { Link2, CheckSquare, ArrowRight, Plus, Loader2, Quote, GripVertical, Maximize2, Eye, EyeOff, Settings, X, Clock, Smile, ChevronDown } from 'lucide-react';
import { api } from '@/api';
import { useAuth } from '@/hooks';

// Types for API responses
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Widget registry - defines all available widgets
type WidgetId = 'openTasks' | 'quote' | 'recentActivity' | 'clock' | 'mood';

interface WidgetDefinition {
  id: WidgetId;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  defaultSize: { width: number; height: number };
  category: string;
}

const WIDGET_REGISTRY: Record<WidgetId, WidgetDefinition> = {
  openTasks: {
    id: 'openTasks',
    name: 'Open Tasks',
    description: 'Shows your open tasks (To Do and In Progress)',
    icon: CheckSquare,
    defaultSize: { width: 500, height: 300 },
    category: 'Tasks',
  },
  quote: {
    id: 'quote',
    name: 'Daily Inspiration',
    description: 'Displays an inspirational quote',
    icon: Quote,
    defaultSize: { width: 400, height: 250 },
    category: 'Motivation',
  },
  recentActivity: {
    id: 'recentActivity',
    name: 'Recent Activity',
    description: 'Shows recent task and tool activities',
    icon: Link2,
    defaultSize: { width: 600, height: 400 },
    category: 'Activity',
  },
  clock: {
    id: 'clock',
    name: 'World Clock',
    description: 'Compare two timezones side by side',
    icon: Clock,
    defaultSize: { width: 500, height: 300 },
    category: 'Utility',
  },
  mood: {
    id: 'mood',
    name: 'Mood Tracker',
    description: 'Track your daily mood with emojis',
    icon: Smile,
    defaultSize: { width: 400, height: 300 },
    category: 'Wellness',
  },
};

// Custom Timezone Select Component
interface TimezoneSelectProps {
  label: string;
  value: string;
  options: Array<{ tz: string; label: string; offset: string }>;
  onChange: (value: string) => void;
}

function TimezoneSelect({ label, value, options, onChange }: TimezoneSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedOption = options.find(opt => opt.tz === value);

  // Close dropdown after 2 minutes (120000ms)
  useEffect(() => {
    if (isOpen) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Set new timeout for 2 minutes
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 120000); // 2 minutes
    } else {
      // Clear timeout when closed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleSelect = (tz: string) => {
    onChange(tz);
    setIsOpen(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return (
    <div 
      className="space-y-2 timezone-select-container"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      ref={dropdownRef}
    >
      <label className="text-xs text-theme-secondary font-medium">{label}</label>
      <div className="relative z-50">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="w-full p-2 rounded-lg border border-theme-light bg-theme-background text-theme-primary text-sm flex items-center justify-between hover:bg-theme-surface-elevated transition-colors"
          onMouseDown={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
        >
          <span>{selectedOption?.label || value}</span>
          <ChevronDown 
            size={16} 
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
        
        {isOpen && (
          <div 
            className="absolute z-50 w-full mt-1 bg-theme-background border border-theme-light rounded-lg shadow-elevated max-h-60 overflow-auto"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((option) => (
              <button
                key={option.tz}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(option.tz);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-theme-surface-elevated transition-colors ${
                  option.tz === value ? 'bg-theme-primary/10 text-theme-primary font-medium' : 'text-theme-primary'
                }`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Inspirational quotes
const quotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
  { text: "Innovation is the ability to see change as an opportunity, not a threat.", author: "Steve Jobs" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
];

export function Dashboard() {
  const { user } = useUser();
  const { getToken } = useClerkAuth();
  const { backendUser } = useAuth();
  
  // Use backend first name if available, fallback to Clerk
  const firstName = backendUser?.first_name || user?.firstName || 'there';
  
  const [openTasks, setOpenTasks] = useState<Array<{ id: number; title: string; status: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);
  const [recentActivity, setRecentActivity] = useState<Array<{
    action: string;
    item: string;
    time: string;
    timestamp?: number;
    icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  }>>([]);
  
  // Widget layout state - dynamic based on active widgets
  const [widgetLayout, setWidgetLayout] = useState<Record<WidgetId, { x: number; y: number; width: number; height: number }>>({
    openTasks: { x: 0, y: 0, width: 500, height: 300 },
    quote: { x: 520, y: 0, width: 400, height: 250 },
    recentActivity: { x: 0, y: 320, width: 600, height: 400 },
  });

  // Active widgets - which widgets are added to the dashboard
  const [activeWidgets, setActiveWidgets] = useState<WidgetId[]>(['openTasks', 'quote', 'recentActivity']);

  // Widget visibility state
  const [widgetVisibility, setWidgetVisibility] = useState<Record<WidgetId, boolean>>({
    openTasks: true,
    quote: true,
    recentActivity: true,
  });

  const [isWidgetManagerOpen, setIsWidgetManagerOpen] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  
  // Clock widget state
  const [clockTimezones, setClockTimezones] = useState<{ timezone1: string; timezone2: string }>({
    timezone1: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezone2: 'America/New_York',
  });
  const [currentTime, setCurrentTime] = useState<{ time1: string; time2: string; date1: string; date2: string }>({
    time1: '',
    time2: '',
    date1: '',
    date2: '',
  });

  // Mood widget state
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [moodHistory, setMoodHistory] = useState<Array<{ date: string; mood: string }>>([]);
  
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [resizingWidget, setResizingWidget] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Load dashboard layout from preferences
  useEffect(() => {
    async function loadLayout() {
      try {
        const token = await getToken?.();
        const preferences = await api.get<{ 
          dashboard_layout?: any;
          dashboard_active_widgets?: WidgetId[];
          dashboard_widget_visibility?: Record<WidgetId, boolean>;
        }>('/users/preferences/', token || undefined);
        
        // Load active widgets - default to all if not set
        const loadedActiveWidgets: WidgetId[] = 
          (preferences.dashboard_active_widgets && Array.isArray(preferences.dashboard_active_widgets) && preferences.dashboard_active_widgets.length > 0)
            ? preferences.dashboard_active_widgets
            : ['openTasks', 'quote', 'recentActivity'];
        
        setActiveWidgets(loadedActiveWidgets);
        
        // Load layout for active widgets
        const loadedLayout: Record<WidgetId, { x: number; y: number; width: number; height: number }> = {} as any;
        let yOffset = 0;
        
        loadedActiveWidgets.forEach((widgetId: WidgetId) => {
          const widgetDef = WIDGET_REGISTRY[widgetId];
          if (!widgetDef) return;
          
          if (preferences.dashboard_layout && preferences.dashboard_layout[widgetId]) {
            // Use saved layout
            loadedLayout[widgetId] = preferences.dashboard_layout[widgetId];
          } else {
            // Initialize with default layout
            loadedLayout[widgetId] = {
              x: yOffset % 2 === 0 ? 0 : 520,
              y: Math.floor(yOffset / 2) * 320,
              width: widgetDef.defaultSize.width,
              height: widgetDef.defaultSize.height,
            };
            yOffset++;
          }
        });
        
        setWidgetLayout(loadedLayout);
        
        // Load widget visibility - default to all visible
        const loadedVisibility: Record<WidgetId, boolean> = {} as any;
        loadedActiveWidgets.forEach((widgetId: WidgetId) => {
          // Default to true if not explicitly set to false
          loadedVisibility[widgetId] = 
            preferences.dashboard_widget_visibility?.[widgetId] !== false;
        });
        setWidgetVisibility(loadedVisibility);
        
        // Ensure all active widgets have visibility set
        const finalVisibility: Record<WidgetId, boolean> = { ...loadedVisibility };
        loadedActiveWidgets.forEach((widgetId: WidgetId) => {
          if (finalVisibility[widgetId] === undefined) {
            finalVisibility[widgetId] = true;
          }
        });
        setWidgetVisibility(finalVisibility);
        
        // Load clock widget preferences
        if (preferences.clock_widget_timezones) {
          setClockTimezones(preferences.clock_widget_timezones);
        }
        
        // Load mood widget preferences
        if (preferences.mood_widget_current) {
          setCurrentMood(preferences.mood_widget_current);
        }
        if (preferences.mood_widget_history && Array.isArray(preferences.mood_widget_history)) {
          setMoodHistory(preferences.mood_widget_history);
        }
      } catch (err) {
        console.error('Failed to load dashboard layout:', err);
        // On error, ensure defaults are set
        setActiveWidgets(['openTasks', 'quote', 'recentActivity']);
      }
    }
    loadLayout();
  }, [getToken]);

  // Fetch stats and activities from backend
  useEffect(() => {
    async function fetchStats() {
      try {
        const token = await getToken?.();
        
        // Fetch tasks to get open tasks (To Do + In Progress)
        const tasksRes = await api.get<PaginatedResponse<any>>('/tasks/', token || undefined);

        // Get top-level open tasks (To Do + In Progress)
        let openTasksList: Array<{ id: number; title: string; status: string }> = [];
        if (tasksRes && tasksRes.results && Array.isArray(tasksRes.results)) {
          openTasksList = tasksRes.results
            .filter((task: any) => {
              // Only top-level tasks (no parent_task) with todo or in_progress status
              return !task.parent_task && (task.status === 'todo' || task.status === 'in_progress');
            })
            .map((task: any) => ({
              id: task.id,
              title: task.title,
              status: task.status,
            }));
        }

        setOpenTasks(openTasksList);

        // Fetch recent activities
        await fetchRecentActivities(token || undefined);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
    
    // Set a random quote on component mount
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, [getToken]);

  // Update clock times
  useEffect(() => {
    const updateClock = () => {
      const now1 = new Date();
      const now2 = new Date();
      
      const time1 = new Intl.DateTimeFormat('en-US', {
        timeZone: clockTimezones.timezone1,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now1);
      
      const date1 = new Intl.DateTimeFormat('en-US', {
        timeZone: clockTimezones.timezone1,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(now1);
      
      const time2 = new Intl.DateTimeFormat('en-US', {
        timeZone: clockTimezones.timezone2,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now2);
      
      const date2 = new Intl.DateTimeFormat('en-US', {
        timeZone: clockTimezones.timezone2,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(now2);
      
      setCurrentTime({ time1, time2, date1, date2 });
    };
    
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [clockTimezones]);

  // Save clock timezones
  const saveClockTimezones = async (timezones: { timezone1: string; timezone2: string }) => {
    try {
      const token = await getToken?.();
      await api.post('/users/update_preferences/', { clock_widget_timezones: timezones }, token || undefined);
    } catch (err) {
      console.error('Failed to save clock timezones:', err);
    }
  };

  // Save mood
  const saveMood = async (mood: string) => {
    try {
      const token = await getToken?.();
      const today = new Date().toISOString().split('T')[0];
      const newHistory = [...moodHistory];
      const existingIndex = newHistory.findIndex(entry => entry.date === today);
      
      if (existingIndex >= 0) {
        newHistory[existingIndex] = { date: today, mood };
      } else {
        newHistory.push({ date: today, mood });
      }
      
      // Keep only last 30 days
      const recentHistory = newHistory.slice(-30);
      
      setCurrentMood(mood);
      setMoodHistory(recentHistory);
      
      await api.post('/users/update_preferences/', { 
        mood_widget_current: mood,
        mood_widget_history: recentHistory,
      }, token || undefined);
    } catch (err) {
      console.error('Failed to save mood:', err);
    }
  };

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

  // Save layout to preferences (using ref to get latest state)
  const saveLayoutRef = useRef<typeof widgetLayout>(widgetLayout);
  saveLayoutRef.current = widgetLayout;

  const saveLayout = async (layout?: typeof widgetLayout) => {
    const layoutToSave = layout || saveLayoutRef.current;
    try {
      const token = await getToken?.();
      await api.post('/users/update_preferences/', { dashboard_layout: layoutToSave }, token || undefined);
    } catch (err) {
      console.error('Failed to save dashboard layout:', err);
    }
  };

  // Save widget visibility
  const saveWidgetVisibility = async (visibility: typeof widgetVisibility) => {
    try {
      const token = await getToken?.();
      await api.post('/users/update_preferences/', { dashboard_widget_visibility: visibility }, token || undefined);
    } catch (err) {
      console.error('Failed to save widget visibility:', err);
    }
  };

  // Save active widgets
  const saveActiveWidgets = async (widgets: WidgetId[]) => {
    try {
      const token = await getToken?.();
      await api.post('/users/update_preferences/', { dashboard_active_widgets: widgets }, token || undefined);
    } catch (err) {
      console.error('Failed to save active widgets:', err);
    }
  };

  // Add widget to dashboard
  const addWidget = async (widgetId: WidgetId) => {
    if (activeWidgets.includes(widgetId)) return;
    
    const newActiveWidgets = [...activeWidgets, widgetId];
    setActiveWidgets(newActiveWidgets);
    
    // Initialize layout for new widget
    const widgetDef = WIDGET_REGISTRY[widgetId];
    const newLayout = {
      ...widgetLayout,
      [widgetId]: {
        x: 0,
        y: Math.max(...Object.values(widgetLayout).map(l => l.y + l.height), 0) + 20,
        width: widgetDef.defaultSize.width,
        height: widgetDef.defaultSize.height,
      },
    };
    setWidgetLayout(newLayout as typeof widgetLayout);
    
    // Initialize visibility
    const newVisibility = {
      ...widgetVisibility,
      [widgetId]: true,
    };
    setWidgetVisibility(newVisibility);
    
    // Save to backend
    await Promise.all([
      saveActiveWidgets(newActiveWidgets),
      saveLayout(newLayout as typeof widgetLayout),
      saveWidgetVisibility(newVisibility),
    ]);
    
    setShowAddWidget(false);
  };

  // Remove widget from dashboard
  const removeWidget = async (widgetId: WidgetId) => {
    if (!confirm(`Are you sure you want to remove the "${WIDGET_REGISTRY[widgetId]?.name}" widget?`)) {
      return;
    }
    
    const newActiveWidgets = activeWidgets.filter(id => id !== widgetId);
    setActiveWidgets(newActiveWidgets);
    
    // Remove from layout
    const newLayout: Record<WidgetId, { x: number; y: number; width: number; height: number }> = {} as any;
    newActiveWidgets.forEach(id => {
      if (widgetLayout[id]) {
        newLayout[id] = widgetLayout[id];
      }
    });
    setWidgetLayout(newLayout);
    
    // Remove from visibility
    const newVisibility: Record<WidgetId, boolean> = {} as any;
    newActiveWidgets.forEach(id => {
      if (widgetVisibility[id] !== undefined) {
        newVisibility[id] = widgetVisibility[id];
      }
    });
    setWidgetVisibility(newVisibility);
    
    // Save to backend
    await Promise.all([
      saveActiveWidgets(newActiveWidgets),
      saveLayout(newLayout),
      saveWidgetVisibility(newVisibility),
    ]);
  };

  // Toggle widget visibility
  const toggleWidgetVisibility = async (widgetId: WidgetId) => {
    const newVisibility = {
      ...widgetVisibility,
      [widgetId]: !widgetVisibility[widgetId],
    };
    setWidgetVisibility(newVisibility);
    await saveWidgetVisibility(newVisibility);
  };

  // Drag handlers using mouse events
  const [dragStart, setDragStart] = useState<{ x: number; y: number; widgetX: number; widgetY: number } | null>(null);

  const handleDragStart = (e: React.MouseEvent, widgetId: string) => {
    // Don't start dragging if clicking on a select element or its container
    const target = e.target as HTMLElement;
    if (target.tagName === 'SELECT' || 
        target.closest('select') || 
        target.closest('.timezone-select-container') ||
        target.closest('option')) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    setDraggedWidget(widgetId);
    const layout = widgetLayout[widgetId as WidgetId];
    if (layout) {
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        widgetX: layout.x,
        widgetY: layout.y,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggedWidget || !dragStart) return;
      
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      setWidgetLayout(prev => {
        const layout = prev[draggedWidget as WidgetId];
        if (!layout) return prev;
        return {
          ...prev,
          [draggedWidget]: {
            ...layout,
            x: Math.max(0, dragStart.widgetX + deltaX),
            y: Math.max(0, dragStart.widgetY + deltaY),
          }
        };
      });
    };

    const handleMouseUp = () => {
      if (draggedWidget) {
        setDraggedWidget(null);
        setDragStart(null);
      }
    };

    if (draggedWidget) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedWidget, dragStart]);

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, widgetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingWidget(widgetId);
    const layout = widgetLayout[widgetId as WidgetId];
    if (layout) {
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: layout.width,
        height: layout.height,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingWidget || !resizeStart) return;
      
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      setWidgetLayout(prev => {
        const newLayout = {
          ...prev,
          [resizingWidget]: {
            ...prev[resizingWidget as keyof typeof prev],
            width: Math.max(200, resizeStart.width + deltaX),
            height: Math.max(150, resizeStart.height + deltaY),
          }
        };
        return newLayout;
      });
    };

    const handleMouseUp = () => {
      if (resizingWidget) {
        setResizingWidget(null);
        setResizeStart(null);
      }
    };

    if (resizingWidget) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingWidget, resizeStart]);

  // Save layout when dragging or resizing ends
  useEffect(() => {
    if (!draggedWidget && !resizingWidget) {
      const timer = setTimeout(() => {
        saveLayout();
      }, 500); // Debounce saves
      return () => clearTimeout(timer);
    }
  }, [draggedWidget, resizingWidget]);

  // Widget component with drag and resize
  const DraggableWidget = ({ 
    widgetId, 
    children, 
    layout 
  }: { 
    widgetId: WidgetId; 
    children: React.ReactNode;
    layout: { x: number; y: number; width: number; height: number };
  }) => {
    const isDragging = draggedWidget === widgetId;
    const isResizing = resizingWidget === widgetId;
    // Default to visible if visibility not set
    const isVisible = widgetVisibility[widgetId] !== false;

    if (!isVisible) return null;

    return (
      <div
        className={`absolute group transition-all duration-200 ${
          isDragging ? 'opacity-70 z-50 shadow-2xl' : 'opacity-100 z-10'
        } ${isResizing ? 'select-none' : ''}`}
        style={{
          left: `${layout.x}px`,
          top: `${layout.y}px`,
          width: `${layout.width}px`,
          minHeight: `${layout.height}px`,
        }}
        onMouseDown={(e) => {
          // Don't start dragging if clicking on a select element or its container
          const target = e.target as HTMLElement;
          if (target.tagName === 'SELECT' || 
              target.closest('select') || 
              target.closest('.timezone-select-container') ||
              target.closest('option')) {
            e.stopPropagation();
            // Don't prevent default - let the select dropdown open naturally
            return;
          }
        }}
        onClick={(e) => {
          // Prevent clicks on select elements from bubbling
          const target = e.target as HTMLElement;
          if (target.tagName === 'SELECT' || 
              target.closest('select') || 
              target.closest('.timezone-select-container')) {
            e.stopPropagation();
          }
        }}
      >
        {/* Drag Handle */}
        <div
          className="absolute top-2 left-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-20 hover:bg-theme-surface-elevated"
          onMouseDown={(e) => handleDragStart(e, widgetId)}
        >
          <GripVertical size={16} className="text-theme-tertiary" />
        </div>

        {/* Hide Button */}
        <div
          className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-theme-surface-elevated cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            toggleWidgetVisibility(widgetId);
          }}
          title="Hide widget"
        >
          <EyeOff size={16} className="text-theme-tertiary" />
        </div>

        {/* Resize Handle */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-end justify-end p-1 hover:bg-theme-surface-elevated rounded-tl-lg"
          onMouseDown={(e) => handleResizeStart(e, widgetId)}
        >
          <Maximize2 size={16} className="text-theme-tertiary rotate-45" />
        </div>

        <div className="h-full">
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-serif font-bold text-theme-primary mb-2">
          Welcome back, {firstName}
        </h1>
        <p className="text-theme-secondary">
          Here's what's happening in your workspace today.
        </p>
        </div>
        <Button
          onClick={() => setIsWidgetManagerOpen(true)}
          variant="outline"
          className="gap-2"
        >
          <Settings size={18} />
          Manage Widgets
        </Button>
      </div>

      {/* Draggable Widgets Container */}
      <div className="relative min-h-[600px]">
        {/* Render active widgets dynamically */}
        {activeWidgets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-theme-secondary mb-4">No widgets added to your dashboard yet.</p>
            <Button onClick={() => setIsWidgetManagerOpen(true)} variant="outline">
              <Plus size={16} className="mr-2" />
              Add Widgets
            </Button>
          </div>
        ) : (
          activeWidgets.map((widgetId) => {
            if (!widgetLayout[widgetId]) {
              console.warn(`Layout not found for widget: ${widgetId}`);
              return null;
            }
            
            const layout = widgetLayout[widgetId];
          
          // Open Tasks Widget
          if (widgetId === 'openTasks') {
            return (
              <DraggableWidget key={widgetId} widgetId={widgetId} layout={layout}>
          <Link to="/tasks" onClick={(e) => draggedWidget && e.preventDefault()}>
            <Card 
              variant="elevated" 
              className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-theme-secondary mb-1">Open Tasks</p>
                  {isLoading ? (
                    <div className="h-9 flex items-center">
                      <Loader2 size={24} className="animate-spin text-theme-tertiary" />
                    </div>
                  ) : (
                    <p className="text-lg font-serif font-bold text-theme-primary">
                      {openTasks.length} {openTasks.length === 1 ? 'task' : 'tasks'}
                    </p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-theme-warning">
                  <CheckSquare size={20} strokeWidth={1.5} style={{ color: 'white' }} />
                </div>
              </div>
              {!isLoading && openTasks.length > 0 && (
                <div className="space-y-2 mt-4 pt-4 border-t border-theme-light">
                  {openTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        task.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-sm text-theme-secondary truncate">{task.title}</span>
                    </div>
                  ))}
                </div>
              )}
              {!isLoading && openTasks.length === 0 && (
                <div className="mt-4 pt-4 border-t border-theme-light">
                  <p className="text-sm text-theme-tertiary">No open tasks</p>
                </div>
              )}
            </Card>
          </Link>
        </DraggableWidget>
            );
          }
          
          // Quote Widget
          if (widgetId === 'quote') {
            return (
              <DraggableWidget key={widgetId} widgetId={widgetId} layout={layout}>
          <Card 
            variant="elevated" 
            className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <Quote size={20} className="text-theme-primary" />
                <CardTitle>Daily Inspiration</CardTitle>
      </div>
            </CardHeader>
            <CardContent>
              {quote && (
                <div className="space-y-4">
                  <p className="text-base text-theme-primary italic leading-relaxed">
                    "{quote.text}"
                  </p>
                  <p className="text-sm text-theme-tertiary text-right">
                    — {quote.author}
                  </p>
      </div>
              )}
            </CardContent>
          </Card>
        </DraggableWidget>
            );
          }
          
          // Recent Activity Widget
          if (widgetId === 'recentActivity') {
            return (
              <DraggableWidget key={widgetId} widgetId={widgetId} layout={layout}>
          <Card 
            variant="elevated" 
            className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Link
                  to="/activity"
                  className="text-sm text-theme-accent hover:text-theme-primary-hover flex items-center gap-1"
                  onClick={(e) => draggedWidget && e.preventDefault()}
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
                      <activity.icon size={18} strokeWidth={1.5} style={{ color: 'white' }} />
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
        </DraggableWidget>
            );
          }
          
          // Clock Widget
          if (widgetId === 'clock') {
            // Get common timezones with labels and UTC offsets
            const getTimezoneInfo = (tz: string) => {
              try {
                const now = new Date();
                
                // Get timezone abbreviation (EST, PST, etc.)
                const formatter = new Intl.DateTimeFormat('en-US', {
                  timeZone: tz,
                  timeZoneName: 'short',
                });
                const parts = formatter.formatToParts(now);
                const tzAbbr = parts.find(part => part.type === 'timeZoneName')?.value || '';
                
                // Get UTC offset
                const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
                const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
                const offsetMs = tzDate.getTime() - utcDate.getTime();
                const offsetHours = offsetMs / (1000 * 60 * 60);
                const offsetSign = offsetHours >= 0 ? '+' : '';
                const offsetStr = `${offsetSign}${Math.round(offsetHours)}`;
                
                // Friendly timezone names
                const tzNames: Record<string, string> = {
                  'America/New_York': 'Eastern Time',
                  'America/Chicago': 'Central Time',
                  'America/Denver': 'Mountain Time',
                  'America/Los_Angeles': 'Pacific Time',
                  'Europe/London': 'London',
                  'Europe/Paris': 'Paris',
                  'Europe/Berlin': 'Berlin',
                  'Asia/Tokyo': 'Tokyo',
                  'Asia/Shanghai': 'Shanghai',
                  'Asia/Dubai': 'Dubai',
                  'Australia/Sydney': 'Sydney',
                  'America/Sao_Paulo': 'São Paulo',
                  'America/Mexico_City': 'Mexico City',
                };
                
                const friendlyName = tzNames[tz] || tz.replace('America/', '').replace('Europe/', '').replace('Asia/', '').replace('Australia/', '').replace('_', ' ');
                const displayName = `${friendlyName} (${tzAbbr}, UTC${offsetStr})`;
                
                return { tz, label: displayName, offset: offsetStr };
              } catch {
                return { tz, label: tz.replace('_', ' '), offset: '' };
              }
            };
            
            const commonTimezones = [
              'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
              'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
              'Asia/Dubai', 'Australia/Sydney', 'America/Sao_Paulo', 'America/Mexico_City',
            ];
            
            const timezoneOptions = commonTimezones.map(getTimezoneInfo);
            
            return (
              <DraggableWidget key={widgetId} widgetId={widgetId} layout={layout}>
                <Card 
                  variant="elevated" 
                  className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  onMouseDown={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('.timezone-select-container') || target.closest('select')) {
                      e.stopPropagation();
                    }
                  }}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('.timezone-select-container') || target.closest('select')) {
                      e.stopPropagation();
                    }
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Clock size={20} className="text-theme-primary" />
                      <CardTitle>World Clock</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent
                    onMouseDown={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('.timezone-select-container') || target.closest('select')) {
                        e.stopPropagation();
                      }
                    }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('.timezone-select-container') || target.closest('select')) {
                        e.stopPropagation();
                      }
                    }}
                  >
                    <div className="space-y-6">
                      {/* Timezone 1 */}
                      <TimezoneSelect
                        label="Timezone 1"
                        value={clockTimezones.timezone1}
                        options={timezoneOptions}
                        onChange={(value) => {
                          const newTimezones = { ...clockTimezones, timezone1: value };
                          setClockTimezones(newTimezones);
                          saveClockTimezones(newTimezones);
                        }}
                      />
                      <div className="text-center">
                        <div className="text-2xl font-bold text-theme-primary">{currentTime.time1}</div>
                        <div className="text-xs text-theme-secondary mt-1">{currentTime.date1}</div>
        </div>

                      {/* Timezone 2 */}
                      <TimezoneSelect
                        label="Timezone 2"
                        value={clockTimezones.timezone2}
                        options={timezoneOptions}
                        onChange={(value) => {
                          const newTimezones = { ...clockTimezones, timezone2: value };
                          setClockTimezones(newTimezones);
                          saveClockTimezones(newTimezones);
                        }}
                      />
                      <div className="text-center">
                        <div className="text-2xl font-bold text-theme-primary">{currentTime.time2}</div>
                        <div className="text-xs text-theme-secondary mt-1">{currentTime.date2}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DraggableWidget>
            );
          }
          
          // Mood Widget
          if (widgetId === 'mood') {
            const moods = [
              { emoji: '😀', label: 'Great' },
              { emoji: '🙂', label: 'Good' },
              { emoji: '😐', label: 'Okay' },
              { emoji: '😔', label: 'Sad' },
              { emoji: '😢', label: 'Very Sad' },
              { emoji: '😴', label: 'Tired' },
              { emoji: '😎', label: 'Cool' },
              { emoji: '🤔', label: 'Thoughtful' },
            ];
            
            const today = new Date().toISOString().split('T')[0];
            const todayMood = moodHistory.find(entry => entry.date === today);
            
            return (
              <DraggableWidget key={widgetId} widgetId={widgetId} layout={layout}>
                <Card 
                  variant="elevated" 
                  className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                >
            <CardHeader>
                    <div className="flex items-center gap-2">
                      <Smile size={20} className="text-theme-primary" />
                      <CardTitle>Mood Tracker</CardTitle>
                    </div>
            </CardHeader>
            <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-theme-secondary mb-3">How are you feeling today?</p>
                        <div className="grid grid-cols-4 gap-2">
                          {moods.map((mood) => (
                            <button
                              key={mood.emoji}
                              onClick={() => saveMood(mood.emoji)}
                              className={`p-3 rounded-lg text-2xl transition-all hover:scale-110 ${
                                (todayMood?.mood === mood.emoji || currentMood === mood.emoji)
                                  ? 'ring-2 ring-theme-primary'
                                  : ''
                              }`}
                              title={mood.label}
                            >
                              {mood.emoji}
                            </button>
                          ))}
                  </div>
                  </div>
                      
                      {todayMood && (
                        <div className="pt-3 border-t border-theme-light">
                          <p className="text-xs text-theme-secondary mb-2">Today's Mood</p>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{todayMood.mood}</span>
                            <span className="text-sm text-theme-primary">
                              {moods.find(m => m.emoji === todayMood.mood)?.label}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {moodHistory.length > 0 && (
                        <div className="pt-3 border-t border-theme-light">
                          <p className="text-xs text-theme-secondary mb-2">Recent Moods</p>
                          <div className="flex gap-1 flex-wrap">
                            {moodHistory.slice(-7).reverse().map((entry, idx) => (
                              <div
                                key={idx}
                                className="text-lg"
                                title={new Date(entry.date).toLocaleDateString()}
                              >
                                {entry.mood}
                  </div>
                            ))}
                          </div>
                        </div>
                      )}
              </div>
            </CardContent>
          </Card>
              </DraggableWidget>
            );
          }
          
          return null;
          })
        )}
        </div>

      {/* Widget Manager Modal */}
      {isWidgetManagerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface rounded-xl shadow-elevated w-full max-w-2xl border border-theme-light">
            <div className="flex items-center justify-between p-6 border-b border-theme-light">
              <h2 className="text-xl font-serif font-semibold text-theme-primary">Manage Widgets</h2>
              <button 
                onClick={() => setIsWidgetManagerOpen(false)} 
                className="p-2 text-theme-tertiary hover:text-theme-primary rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
      </div>
            <div className="p-6 space-y-6">
              {/* Active Widgets Section */}
        <div>
                <h3 className="text-lg font-medium text-theme-primary mb-4">Active Widgets</h3>
              <div className="space-y-3">
                  {activeWidgets.map((widgetId) => {
                    const widget = WIDGET_REGISTRY[widgetId];
                    if (!widget) return null;
                    
                    return (
                      <div
                        key={widgetId}
                        className="flex items-center justify-between p-4 rounded-lg border border-theme-light hover:bg-theme-surface-elevated transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 bg-theme-surface-elevated rounded-lg">
                            <widget.icon size={18} className="text-theme-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-theme-primary">{widget.name}</p>
                            <p className="text-sm text-theme-secondary">{widget.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleWidgetVisibility(widgetId)}
                            className={`p-2 rounded-lg transition-colors ${
                              widgetVisibility[widgetId]
                                ? 'text-theme-primary hover:bg-theme-primary/10'
                                : 'text-theme-tertiary hover:bg-theme-surface-elevated'
                            }`}
                            title={widgetVisibility[widgetId] ? 'Hide widget' : 'Show widget'}
                          >
                            {widgetVisibility[widgetId] ? (
                              <Eye size={20} />
                            ) : (
                              <EyeOff size={20} />
                            )}
                          </button>
                          <button
                            onClick={() => removeWidget(widgetId)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Remove widget"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Widget Section */}
              <div className="pt-4 border-t border-theme-light">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-theme-primary">Available Widgets</h3>
                  <Button
                    onClick={() => setShowAddWidget(!showAddWidget)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Plus size={16} />
                    {showAddWidget ? 'Hide' : 'Show'} Available
                  </Button>
                  </div>
                {showAddWidget && (
                  <div className="space-y-3">
                    {Object.values(WIDGET_REGISTRY)
                      .filter(widget => !activeWidgets.includes(widget.id))
                      .map((widget) => (
                        <div
                          key={widget.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-theme-light hover:bg-theme-surface-elevated transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-theme-surface-elevated rounded-lg">
                              <widget.icon size={18} className="text-theme-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-theme-primary">{widget.name}</p>
                              <p className="text-sm text-theme-secondary">{widget.description}</p>
                              <p className="text-xs text-theme-tertiary mt-1">Category: {widget.category}</p>
                            </div>
                  </div>
                          <Button
                            onClick={() => addWidget(widget.id)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Plus size={16} />
                            Add
                          </Button>
                        </div>
                      ))}
                    {Object.values(WIDGET_REGISTRY).filter(widget => !activeWidgets.includes(widget.id)).length === 0 && (
                      <p className="text-sm text-theme-tertiary text-center py-4">
                        All available widgets are already added to your dashboard.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-theme-light">
                <p className="text-sm text-theme-tertiary">
                  Drag widgets to reposition them, and resize by dragging the corner handle. Hidden widgets remain on your dashboard but are not visible.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

