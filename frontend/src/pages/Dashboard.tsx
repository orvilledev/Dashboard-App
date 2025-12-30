import { Link } from 'react-router-dom';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { Link2, CheckSquare, ArrowRight, Plus, Loader2, Quote, GripVertical, Maximize2, Eye, EyeOff, Settings, X, Clock, Smile, ChevronDown, StickyNote, Calendar as CalendarIcon, Timer, Calculator, Bookmark, Target, Coffee, BarChart3, Cloud, Zap, Code, AlarmClock } from 'lucide-react';
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
type WidgetId = 'openTasks' | 'quote' | 'recentActivity' | 'clock' | 'mood' | 'notes' | 'calendar' | 'timer' | 'calculator' | 'quickLinks' | 'goalTracker' | 'pomodoro' | 'dailyStats' | 'weather' | 'quickActions' | 'custom' | 'alarm';

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
  notes: {
    id: 'notes',
    name: 'Quick Notes',
    description: 'Take quick notes and reminders',
    icon: StickyNote,
    defaultSize: { width: 400, height: 350 },
    category: 'Productivity',
  },
  calendar: {
    id: 'calendar',
    name: 'Upcoming Events',
    description: 'View upcoming events and deadlines',
    icon: CalendarIcon,
    defaultSize: { width: 450, height: 400 },
    category: 'Organization',
  },
  timer: {
    id: 'timer',
    name: 'Timer & Stopwatch',
    description: 'Countdown timer and stopwatch',
    icon: Timer,
    defaultSize: { width: 350, height: 300 },
    category: 'Utility',
  },
  calculator: {
    id: 'calculator',
    name: 'Calculator',
    description: 'Quick access calculator',
    icon: Calculator,
    defaultSize: { width: 320, height: 400 },
    category: 'Utility',
  },
  quickLinks: {
    id: 'quickLinks',
    name: 'Quick Links',
    description: 'Your frequently used links',
    icon: Bookmark,
    defaultSize: { width: 400, height: 300 },
    category: 'Navigation',
  },
  goalTracker: {
    id: 'goalTracker',
    name: 'Goal Tracker',
    description: 'Track your daily and weekly goals',
    icon: Target,
    defaultSize: { width: 450, height: 350 },
    category: 'Productivity',
  },
  pomodoro: {
    id: 'pomodoro',
    name: 'Pomodoro Timer',
    description: 'Focus timer with work/break cycles',
    icon: Coffee,
    defaultSize: { width: 350, height: 350 },
    category: 'Productivity',
  },
  dailyStats: {
    id: 'dailyStats',
    name: 'Daily Stats',
    description: 'Your daily productivity statistics',
    icon: BarChart3,
    defaultSize: { width: 500, height: 300 },
    category: 'Analytics',
  },
  weather: {
    id: 'weather',
    name: 'Weather',
    description: 'Current weather information',
    icon: Cloud,
    defaultSize: { width: 350, height: 250 },
    category: 'Utility',
  },
  quickActions: {
    id: 'quickActions',
    name: 'Quick Actions',
    description: 'Quick access to common actions',
    icon: Zap,
    defaultSize: { width: 400, height: 300 },
    category: 'Navigation',
  },
  custom: {
    id: 'custom',
    name: 'Custom Widget',
    description: 'Create your own custom widget from scratch',
    icon: Code,
    defaultSize: { width: 500, height: 400 },
    category: 'Custom',
  },
  alarm: {
    id: 'alarm',
    name: 'Alarm Clock',
    description: 'Set and manage multiple alarms',
    icon: AlarmClock,
    defaultSize: { width: 400, height: 450 },
    category: 'Utility',
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
  const timeoutRef = useRef<number | null>(null);
  const isInteractingRef = useRef(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const clickCountRef = useRef(0);

  const selectedOption = options.find(opt => opt.tz === value);

  // Close dropdown after 5 minutes (300000ms)
  useEffect(() => {
    if (isOpen) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Set new timeout for 5 minutes
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 300000); // 5 minutes
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

  // Keep dropdown open - only close when option is selected or toggle button is clicked
  // No auto-close on outside clicks - user must explicitly select an option
  useEffect(() => {
    // Don't add any outside click listeners
    // Dropdown will only close when:
    // 1. User selects an option (handled in handleSelect)
    // 2. User clicks the toggle button again (handled in button onClick)
    // 3. 5-minute timeout (handled in separate useEffect)
    
    if (isOpen) {
      // Reset click count when dropdown opens
      clickCountRef.current = 0;
      // Clear any pending close timeouts
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    }
  }, [isOpen]);

  const handleSelect = (tz: string) => {
    // Clear any pending close timeouts
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    // Reset click count when selecting
    clickCountRef.current = 0;
    isInteractingRef.current = false;
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
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            // Clear any pending close timeouts
            if (closeTimeoutRef.current) {
              clearTimeout(closeTimeoutRef.current);
              closeTimeoutRef.current = null;
            }
            isInteractingRef.current = true;
            setIsOpen(!isOpen);
            // Reset interaction flag after a delay
            setTimeout(() => {
              isInteractingRef.current = false;
            }, 100);
          }}
          className="w-full p-2 rounded-lg border border-theme-light bg-theme-background text-theme-primary text-sm flex items-center justify-between hover:bg-theme-surface-elevated transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            isInteractingRef.current = true;
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
            className="absolute z-50 w-full mt-1 bg-theme-background border border-theme-light rounded-lg shadow-elevated max-h-60 overflow-y-auto overscroll-contain"
            style={{ 
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch'
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              isInteractingRef.current = true;
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
            onWheel={(e) => {
              // Allow scrolling - prevent event from bubbling to parent
              e.stopPropagation();
            }}
            onTouchMove={(e) => {
              // Allow touch scrolling
              e.stopPropagation();
            }}
            onMouseEnter={() => {
              // Keep dropdown open when hovering
              isInteractingRef.current = true;
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
              }
            }}
            onMouseLeave={() => {
              // Don't close on mouse leave - dropdown stays open indefinitely
              // Just ensure interaction flag is set
              isInteractingRef.current = true;
            }}
          >
            {options.map((option) => (
              <button
                key={option.tz}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  handleSelect(option.tz);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
                onTouchStart={(e) => {
                  // Allow touch interaction
                  e.stopPropagation();
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-theme-surface-elevated transition-colors cursor-pointer ${
                  option.tz === value ? 'bg-theme-primary/10 text-theme-primary font-medium' : 'text-theme-primary'
                }`}
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
  const [widgetLayout, setWidgetLayout] = useState<Partial<Record<WidgetId, { x: number; y: number; width: number; height: number }>>>({
    openTasks: { x: 0, y: 0, width: 500, height: 300 },
    quote: { x: 520, y: 0, width: 400, height: 250 },
    recentActivity: { x: 0, y: 320, width: 600, height: 400 },
  });

  // Active widgets - which widgets are added to the dashboard
  const [activeWidgets, setActiveWidgets] = useState<WidgetId[]>(['openTasks', 'quote', 'recentActivity']);

  // Widget visibility state
  const [widgetVisibility, setWidgetVisibility] = useState<Partial<Record<WidgetId, boolean>>>({
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
  
  // New widget states
  const [notesContent, setNotesContent] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'timer' | 'stopwatch'>('stopwatch');
  const [timerMinutes, setTimerMinutes] = useState(5);
  
  // Timer effect - moved to component level to avoid hook ordering issues
  const timerIntervalRef = useRef<number | null>(null);
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (timerMode === 'timer' && prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return timerMode === 'timer' ? prev - 1 : prev + 1;
        });
      }, 1000);
      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, [isTimerRunning, timerMode]);
  const [calculatorValue, setCalculatorValue] = useState('0');
  const [quickLinks] = useState<Array<{ id: number; name: string; url: string }>>([
    { id: 1, name: 'Dashboard', url: '/dashboard' },
    { id: 2, name: 'Tasks', url: '/tasks' },
    { id: 3, name: 'Tools', url: '/tools' },
  ]);
  const [goals, setGoals] = useState<Array<{ id: number; text: string; completed: boolean }>>([
    { id: 1, text: 'Complete project tasks', completed: false },
    { id: 2, text: 'Review team updates', completed: false },
  ]);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [pomodoroPhase, setPomodoroPhase] = useState<'work' | 'break'>('work');
  const [dailyStatsData] = useState({
    tasksCompleted: 8,
    tasksCreated: 12,
    timeSpent: '4h 30m',
  });
  
  // Custom widgets state - stores HTML content for each custom widget instance
  const [customWidgets, setCustomWidgets] = useState<Record<string, { title: string; html: string; css: string }>>({});
  const [editingCustomWidget, setEditingCustomWidget] = useState<{ id: string; title: string; html: string; css: string } | null>(null);
  const [isCustomWidgetEditorOpen, setIsCustomWidgetEditorOpen] = useState(false);
  
  // Alarm widget state
  interface Alarm {
    id: string;
    time: string; // HH:MM format
    label: string;
    enabled: boolean;
    repeat: string[]; // ['mon', 'tue', 'wed', etc.] or [] for one-time
    sound: string; // 'default', 'gentle', 'urgent', etc.
  }
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isAddingAlarm, setIsAddingAlarm] = useState(false);
  const [newAlarmTime, setNewAlarmTime] = useState('');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');
  const [newAlarmRepeat, setNewAlarmRepeat] = useState<string[]>([]);
  const [lastCheckedMinute, setLastCheckedMinute] = useState<number>(-1);
  
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
        
        // Load active widgets - default to standard widgets if not set or empty
        // Check if it's a valid non-empty array
        const hasValidActiveWidgets = 
          preferences.dashboard_active_widgets && 
          Array.isArray(preferences.dashboard_active_widgets) && 
          preferences.dashboard_active_widgets.length > 0;
        
        const loadedActiveWidgets: WidgetId[] = hasValidActiveWidgets
          ? preferences.dashboard_active_widgets
          : ['openTasks', 'quote', 'recentActivity'];
        
        // Ensure we always have at least the default widgets
        if (loadedActiveWidgets.length === 0) {
          loadedActiveWidgets.push('openTasks', 'quote', 'recentActivity');
        }
        
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
        // Ensure all active widgets have visibility set (default to true)
        const finalVisibility: Record<WidgetId, boolean> = { ...loadedVisibility };
        loadedActiveWidgets.forEach((widgetId: WidgetId) => {
          if (finalVisibility[widgetId] === undefined || finalVisibility[widgetId] === null) {
            finalVisibility[widgetId] = true;
          }
        });
        setWidgetVisibility(finalVisibility);
        
        // Load clock widget preferences
        const prefs: any = preferences;
        if (prefs.clock_widget_timezones) {
          setClockTimezones(prefs.clock_widget_timezones);
        }
        
        // Load mood widget preferences
        if (prefs.mood_widget_current) {
          setCurrentMood(prefs.mood_widget_current);
        }
        if (prefs.mood_widget_history && Array.isArray(prefs.mood_widget_history)) {
          setMoodHistory(prefs.mood_widget_history);
        }
        
        // Load custom widgets
        if (prefs.custom_widgets && typeof prefs.custom_widgets === 'object') {
          setCustomWidgets(prefs.custom_widgets);
        }
      } catch (err) {
        console.error('Failed to load dashboard layout:', err);
        // On error, ensure defaults are set
        const defaultWidgets: WidgetId[] = ['openTasks', 'quote', 'recentActivity'];
        setActiveWidgets(defaultWidgets);
        
        // Set default layout
        const defaultLayout: Record<WidgetId, { x: number; y: number; width: number; height: number }> = {} as any;
        defaultWidgets.forEach((widgetId, index) => {
          const widgetDef = WIDGET_REGISTRY[widgetId];
          if (widgetDef) {
            defaultLayout[widgetId] = {
              x: index % 2 === 0 ? 0 : 520,
              y: Math.floor(index / 2) * 320,
              width: widgetDef.defaultSize.width,
              height: widgetDef.defaultSize.height,
            };
          }
        });
        setWidgetLayout(defaultLayout);
        
        // Set default visibility (all visible)
        const defaultVisibility: Record<WidgetId, boolean> = {} as any;
        defaultWidgets.forEach((widgetId) => {
          defaultVisibility[widgetId] = true;
        });
        setWidgetVisibility(defaultVisibility);
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
  
  // Save alarms
  const saveAlarms = async (alarmsToSave: Alarm[]) => {
    try {
      const token = await getToken?.();
      await api.post('/users/update_preferences/', { 
        alarm_widget_alarms: alarmsToSave 
      }, token || undefined);
    } catch (err) {
      console.error('Failed to save alarms:', err);
    }
  };
  
  // Trigger alarm notification
  const triggerAlarm = (alarm: Alarm) => {
    // Request notification permission
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`⏰ Alarm: ${alarm.label || 'Alarm'}`, {
          body: `Time: ${alarm.time}`,
          icon: '/favicon.ico',
          tag: alarm.id,
          requireInteraction: true,
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            triggerAlarm(alarm);
          }
        });
      }
    }
    
    // Show visual alert
    alert(`⏰ Alarm: ${alarm.label || 'Alarm'} - ${alarm.time}`);
  };
  
  // Check for alarms that should trigger
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentMinute = now.getMinutes();
      const currentHour = now.getHours();
      const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
      
      // Only check once per minute
      if (currentMinute === lastCheckedMinute) return;
      setLastCheckedMinute(currentMinute);
      
      alarms.forEach(alarm => {
        if (!alarm.enabled) return;
        
        // Check if alarm time matches
        if (alarm.time === currentTime) {
          // Check if it's a repeat day or one-time alarm
          const shouldRing = alarm.repeat.length === 0 || alarm.repeat.includes(currentDay);
          
          if (shouldRing) {
            // Trigger alarm
            triggerAlarm(alarm);
          }
        }
      });
    };
    
    // Check every minute
    const interval = setInterval(checkAlarms, 60000);
    checkAlarms(); // Check immediately
    
    return () => clearInterval(interval);
  }, [alarms, lastCheckedMinute]);
  
  // Save mood
  const saveCustomWidgets = async (widgets: Record<string, { title: string; html: string; css: string }>) => {
    try {
      const token = await getToken?.();
      const prefs: any = {};
      prefs.custom_widgets = widgets;
      await api.post('/users/update_preferences/', prefs, token || undefined);
    } catch (err) {
      console.error('Failed to save custom widgets:', err);
    }
  };
  
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
    
    // For custom widgets, open the editor first
    if (widgetId === 'custom') {
      const customWidgetId = `custom_${Date.now()}`;
      setEditingCustomWidget({ 
        id: customWidgetId, 
        title: 'My Custom Widget',
        html: '',
        css: ''
      });
      setIsCustomWidgetEditorOpen(true);
      // Add to active widgets first, we'll save the layout after they create content
      const newActiveWidgets: WidgetId[] = [...activeWidgets, widgetId];
      setActiveWidgets(newActiveWidgets);
      const widgetDef = WIDGET_REGISTRY[widgetId];
      const newLayout = {
        ...widgetLayout,
        [widgetId]: {
          x: 0,
          y: Math.max(...Object.values(widgetLayout).map(l => (l?.y || 0) + (l?.height || 0)), 0) + 20,
          width: widgetDef.defaultSize.width,
          height: widgetDef.defaultSize.height,
        },
      };
      setWidgetLayout(newLayout);
      return;
    }
    
    const newActiveWidgets = [...activeWidgets, widgetId];
    setActiveWidgets(newActiveWidgets);
    
    // Initialize layout for new widget
    const widgetDef = WIDGET_REGISTRY[widgetId];
    const newLayout = {
      ...widgetLayout,
      [widgetId]: {
        x: 0,
        y: Math.max(...Object.values(widgetLayout).map(l => (l?.y || 0) + (l?.height || 0)), 0) + 20,
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
    // Don't start dragging if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'SELECT' || 
        target.tagName === 'INPUT' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('select') || 
        target.closest('input') ||
        target.closest('button') ||
        target.closest('textarea') ||
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
          // Don't start dragging if clicking on interactive elements
          const target = e.target as HTMLElement;
          if (target.tagName === 'SELECT' || 
              target.tagName === 'INPUT' ||
              target.tagName === 'BUTTON' ||
              target.tagName === 'TEXTAREA' ||
              target.closest('select') || 
              target.closest('input') ||
              target.closest('button') ||
              target.closest('textarea') ||
              target.closest('.timezone-select-container') ||
              target.closest('option')) {
            e.stopPropagation();
            // Don't prevent default - let native controls work naturally
            return;
          }
        }}
        onClick={(e) => {
          // Prevent clicks on interactive elements from bubbling
          const target = e.target as HTMLElement;
          if (target.tagName === 'SELECT' || 
              target.tagName === 'INPUT' ||
              target.tagName === 'BUTTON' ||
              target.tagName === 'TEXTAREA' ||
              target.closest('select') || 
              target.closest('input') ||
              target.closest('button') ||
              target.closest('textarea') ||
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
          className="absolute top-1/2 -translate-y-1/2 right-0 w-6 h-6 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center p-1 hover:bg-theme-surface-elevated rounded-l-lg"
          onMouseDown={(e) => handleResizeStart(e, widgetId)}
        >
          <Maximize2 size={16} className="text-theme-tertiary rotate-90" />
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
                      <activity.icon size={18} strokeWidth={1.5} className="text-white" />
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
                    if (target.closest('.timezone-select-container') || 
                        target.closest('select') ||
                        target.closest('input') ||
                        target.closest('button') ||
                        target.closest('textarea')) {
                      e.stopPropagation();
                    }
                  }}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('.timezone-select-container') || 
                        target.closest('select') ||
                        target.closest('input') ||
                        target.closest('button') ||
                        target.closest('textarea')) {
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
                      if (target.closest('.timezone-select-container') || 
                          target.closest('select') ||
                          target.closest('input') ||
                          target.closest('button') ||
                          target.closest('textarea')) {
                        e.stopPropagation();
                      }
                    }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('.timezone-select-container') || 
                          target.closest('select') ||
                          target.closest('input') ||
                          target.closest('button') ||
                          target.closest('textarea')) {
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
          
          // Notes Widget
          if (widgetId === 'notes') {
            return (
              <DraggableWidget key={widgetId} widgetId={widgetId} layout={layout}>
                <Card variant="elevated" className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <StickyNote size={20} className="text-theme-primary" />
                      <CardTitle>Quick Notes</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      value={notesContent}
                      onChange={(e) => setNotesContent(e.target.value)}
                      placeholder="Write your notes here..."
                      className="w-full h-full min-h-[250px] p-3 rounded-lg border border-theme-light bg-theme-background text-theme-primary resize-none focus:outline-none focus:ring-2 focus:ring-theme-primary"
                      style={{ color: 'var(--color-text-primary)' }}
                    />
                  </CardContent>
                </Card>
              </DraggableWidget>
            );
          }
          
          // Calendar Widget
          if (widgetId === 'calendar') {
            const today = new Date();
            const upcomingDays = Array.from({ length: 7 }, (_, i) => {
              const date = new Date(today);
              date.setDate(today.getDate() + i);
              return date;
            });
            
            return (
              <DraggableWidget key={widgetId} widgetId={widgetId} layout={layout}>
                <Card variant="elevated" className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={20} className="text-theme-primary" />
                      <CardTitle>Upcoming Events</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {upcomingDays.map((date, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-theme-surface-elevated">
                          <div className="flex items-center gap-3">
                            <div className="text-center w-12">
                              <div className="text-xs text-theme-tertiary">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                              <div className="text-lg font-bold text-theme-primary">{date.getDate()}</div>
                            </div>
                            <div className="text-sm text-theme-secondary">
                              {idx === 0 ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                          <div className="text-xs text-theme-tertiary">No events</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </DraggableWidget>
            );
          }
          
          // Timer Widget
          if (widgetId === 'timer') {
            const displayTime = timerMode === 'timer' 
              ? `${String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:${String(timerSeconds % 60).padStart(2, '0')}`
              : `${String(Math.floor(timerSeconds / 3600)).padStart(2, '0')}:${String(Math.floor((timerSeconds % 3600) / 60)).padStart(2, '0')}:${String(timerSeconds % 60).padStart(2, '0')}`;
            
            return (
              <DraggableWidget key={widgetId} widgetId={widgetId} layout={layout}>
                <Card variant="elevated" className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Timer size={20} className="text-theme-primary" />
                      <CardTitle>Timer & Stopwatch</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setTimerMode('timer'); setIsTimerRunning(false); setTimerSeconds(timerMinutes * 60); }}
                          className={`px-4 py-2 rounded-lg text-sm ${timerMode === 'timer' ? 'text-white' : 'bg-theme-surface-elevated text-theme-primary'}`}
                          style={timerMode === 'timer' ? { backgroundColor: '#000000' } : {}}
                        >
                          Timer
                        </button>
                        <button
                          onClick={() => { setTimerMode('stopwatch'); setIsTimerRunning(false); setTimerSeconds(0); }}
                          className={`px-4 py-2 rounded-lg text-sm ${timerMode === 'stopwatch' ? 'text-white' : 'bg-theme-surface-elevated text-theme-primary'}`}
                          style={timerMode === 'stopwatch' ? { backgroundColor: '#000000' } : {}}
                        >
                          Stopwatch
                        </button>
                      </div>
                      {timerMode === 'timer' && (
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            value={timerMinutes}
                            onChange={(e) => { setTimerMinutes(Number(e.target.value)); setTimerSeconds(Number(e.target.value) * 60); }}
                            min="1"
                            max="60"
                            className="w-20 px-3 py-2 rounded-lg border border-theme-light bg-theme-background text-theme-primary"
                            disabled={isTimerRunning}
                          />
                          <span className="text-theme-secondary">minutes</span>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-4xl font-bold text-theme-primary font-mono">{displayTime}</div>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setIsTimerRunning(!isTimerRunning)}
                          className="px-6 py-2 text-white rounded-lg hover:opacity-90"
                          style={{ backgroundColor: '#000000' }}
                        >
                          {isTimerRunning ? 'Pause' : 'Start'}
                        </button>
                        <button
                          onClick={() => { setIsTimerRunning(false); setTimerSeconds(timerMode === 'timer' ? timerMinutes * 60 : 0); }}
                          className="px-6 py-2 bg-theme-surface-elevated text-theme-primary rounded-lg hover:opacity-90"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DraggableWidget>
            );
          }
          
          // Alarm Widget
          if (widgetId === 'alarm') {
            return (
              <DraggableWidget key={widgetId} widgetId={widgetId} layout={layout}>
                <Card variant="elevated" className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlarmClock size={20} className="text-theme-primary" />
                      <CardTitle>Alarm Clock</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Add Alarm Form */}
                      {isAddingAlarm && (
                        <div className="p-3 bg-theme-surface-elevated rounded-lg space-y-3">
                          <Input
                            type="time"
                            value={newAlarmTime}
                            onChange={(e) => setNewAlarmTime(e.target.value)}
                            placeholder="Time"
                            className="w-full"
                          />
                          <Input
                            type="text"
                            value={newAlarmLabel}
                            onChange={(e) => setNewAlarmLabel(e.target.value)}
                            placeholder="Alarm label (optional)"
                            className="w-full"
                          />
                          <div className="flex gap-2 flex-wrap">
                            {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
                              <button
                                key={day}
                                onClick={() => {
                                  setNewAlarmRepeat(prev => 
                                    prev.includes(day) 
                                      ? prev.filter(d => d !== day)
                                      : [...prev, day]
                                  );
                                }}
                                className={`px-2 py-1 text-xs rounded transition-colors ${
                                  newAlarmRepeat.includes(day)
                                    ? 'text-white'
                                    : 'bg-theme-surface text-theme-secondary hover:bg-theme-surface-elevated'
                                }`}
                                style={newAlarmRepeat.includes(day) ? { backgroundColor: '#000000' } : {}}
                              >
                                {day.slice(0, 3).toUpperCase()}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                if (newAlarmTime) {
                                  const newAlarm: Alarm = {
                                    id: `alarm_${Date.now()}`,
                                    time: newAlarmTime,
                                    label: newAlarmLabel,
                                    enabled: true,
                                    repeat: newAlarmRepeat,
                                    sound: 'default',
                                  };
                                  const updated = [...alarms, newAlarm];
                                  setAlarms(updated);
                                  saveAlarms(updated);
                                  setNewAlarmTime('');
                                  setNewAlarmLabel('');
                                  setNewAlarmRepeat([]);
                                  setIsAddingAlarm(false);
                                }
                              }}
                              variant="primary"
                              size="sm"
                            >
                              Add
                            </Button>
                            <Button
                              onClick={() => {
                                setIsAddingAlarm(false);
                                setNewAlarmTime('');
                                setNewAlarmLabel('');
                                setNewAlarmRepeat([]);
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Alarms List */}
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {alarms.length === 0 && !isAddingAlarm && (
                          <p className="text-sm text-theme-tertiary text-center py-4">
                            No alarms set. Click "Add Alarm" to create one.
                          </p>
                        )}
                        {alarms.map(alarm => (
                          <div
                            key={alarm.id}
                            className="flex items-center justify-between p-3 bg-theme-surface-elevated rounded-lg hover:bg-theme-surface transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={alarm.enabled}
                                onChange={(e) => {
                                  const updated = alarms.map(a =>
                                    a.id === alarm.id ? { ...a, enabled: e.target.checked } : a
                                  );
                                  setAlarms(updated);
                                  saveAlarms(updated);
                                }}
                                className="w-4 h-4 rounded border-theme-light text-theme-primary focus:ring-theme-primary"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-theme-primary">{alarm.time}</div>
                                <div className="text-xs text-theme-secondary truncate">
                                  {alarm.label || 'Alarm'}
                                  {alarm.repeat.length > 0 && (
                                    <span className="ml-2">
                                      • {alarm.repeat.map(d => d.slice(0, 3).toUpperCase()).join(', ')}
                                    </span>
                                  )}
                                  {alarm.repeat.length === 0 && <span className="ml-2">• Once</span>}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const updated = alarms.filter(a => a.id !== alarm.id);
                                setAlarms(updated);
                                saveAlarms(updated);
                              }}
                              className="text-theme-error hover:text-theme-error-dark transition-colors p-1"
                              title="Delete alarm"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      {/* Add Alarm Button */}
                      {!isAddingAlarm && (
                        <Button
                          onClick={() => setIsAddingAlarm(true)}
                          variant="outline"
                          className="w-full"
                        >
                          <Plus size={16} className="mr-2" />
                          Add Alarm
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </DraggableWidget>
            );
          }
          
          // Calculator Widget
          if (widgetId === 'calculator') {
            const handleCalcInput = (value: string) => {
              if (value === 'C') {
                setCalculatorValue('0');
              } else if (value === '=') {
                try {
                  const result = eval(calculatorValue);
                  setCalculatorValue(String(result));
                } catch {
                  setCalculatorValue('Error');
                }
              } else {
                setCalculatorValue(prev => prev === '0' || prev === 'Error' ? value : prev + value);
              }
            };
            
            const calcButtons = [
              ['C', '/', '*', '-'],
              ['7', '8', '9', '+'],
              ['4', '5', '6', '-'],
              ['1', '2', '3', '+'],
              ['0', '.', '=', '='],
            ].flat();
            
            return (
              <DraggableWidget key={widgetId} widgetId={widgetId} layout={layout}>
                <Card variant="elevated" className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Calculator size={20} className="text-theme-primary" />
                      <CardTitle>Calculator</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-4 bg-theme-surface-elevated rounded-lg">
                        <div className="text-right text-2xl font-mono font-bold text-theme-primary truncate">{calculatorValue}</div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {calcButtons.map((btn: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => handleCalcInput(btn)}
                            className={`p-3 rounded-lg font-semibold ${
                              btn === '=' || btn === 'C'
                                ? 'text-white'
                                : 'bg-theme-surface-elevated text-theme-primary hover:opacity-80'
                            }`}
                            style={(btn === '=' || btn === 'C') ? { backgroundColor: '#000000' } : {}}
                          >
                            {btn}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DraggableWidget>
            );
          }
          
          // Quick Links Widget
          if (widgetId === 'quickLinks') {
            return (
              <DraggableWidget key={widgetId} widgetId={widgetId} layout={layout}>
                <Card variant="elevated" className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Bookmark size={20} className="text-theme-primary" />
                      <CardTitle>Quick Links</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {quickLinks.map((link) => (
                        <Link
                          key={link.id}
                          to={link.url}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-theme-surface-elevated transition-colors"
                          onClick={(e) => draggedWidget && e.preventDefault()}
                        >
                          <Link2 size={16} className="text-theme-secondary" />
                          <span className="text-sm text-theme-primary">{link.name}</span>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </DraggableWidget>
            );
          }
          
          // Goal Tracker Widget
          if (widgetId === 'goalTracker') {
            const completedCount = goals.filter(g => g.completed).length;
            const progress = goals.length > 0 ? (completedCount / goals.length) * 100 : 0;
            
            return (
              <DraggableWidget key={widgetId} widgetId={widgetId} layout={layout}>
                <Card variant="elevated" className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Target size={20} className="text-theme-primary" />
                      <CardTitle>Goal Tracker</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-theme-secondary">Progress</span>
                          <span className="text-theme-primary font-semibold">{completedCount}/{goals.length}</span>
                        </div>
                        <div className="w-full bg-theme-surface-elevated rounded-full h-2">
                          <div
                            className="bg-theme-primary h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        {goals.map((goal) => (
                          <div key={goal.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-theme-surface-elevated">
                            <input
                              type="checkbox"
                              checked={goal.completed}
                              onChange={(e) => setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, completed: e.target.checked } : g))}
                              className="w-4 h-4"
                            />
                            <span className={`text-sm flex-1 ${goal.completed ? 'line-through text-theme-tertiary' : 'text-theme-primary'}`}>
                              {goal.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DraggableWidget>
            );
          }
          
          // Pomodoro Timer Widget
          if (widgetId === 'pomodoro') {
            const pomodoroIntervalRef = useRef<number | null>(null);
            useEffect(() => {
              if (isPomodoroRunning && widgetId === 'pomodoro') {
                pomodoroIntervalRef.current = setInterval(() => {
                  setPomodoroSeconds(prev => {
                    if (prev <= 1) {
                      if (pomodoroMinutes <= 1) {
                        setIsPomodoroRunning(false);
                        setPomodoroPhase(prevPhase => {
                          const newPhase = prevPhase === 'work' ? 'break' : 'work';
                          setPomodoroMinutes(newPhase === 'work' ? 25 : 5);
                          return newPhase;
                        });
                        return 0;
                      }
                      setPomodoroMinutes(prev => prev - 1);
                      return 59;
                    }
                    return prev - 1;
                  });
                }, 1000);
                return () => {
                  if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
                };
              } else if (pomodoroIntervalRef.current) {
                clearInterval(pomodoroIntervalRef.current);
              }
            }, [isPomodoroRunning, pomodoroMinutes]);
            
            return (
              <DraggableWidget key={widgetId} widgetId={widgetId} layout={layout}>
                <Card variant="elevated" className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Coffee size={20} className="text-theme-primary" />
                      <CardTitle>Pomodoro Timer</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-sm text-theme-secondary mb-2">{pomodoroPhase === 'work' ? 'Work Time' : 'Break Time'}</div>
                        <div className="text-4xl font-bold text-theme-primary font-mono">
                          {String(pomodoroMinutes).padStart(2, '0')}:{String(pomodoroSeconds).padStart(2, '0')}
                        </div>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setIsPomodoroRunning(!isPomodoroRunning)}
                          className="px-6 py-2 text-white rounded-lg hover:opacity-90"
                          style={{ backgroundColor: '#000000' }}
                        >
                          {isPomodoroRunning ? 'Pause' : 'Start'}
                        </button>
                        <button
                          onClick={() => {
                            setIsPomodoroRunning(false);
                            setPomodoroPhase('work');
                            setPomodoroMinutes(25);
                            setPomodoroSeconds(0);
                          }}
                          className="px-6 py-2 bg-theme-surface-elevated text-theme-primary rounded-lg hover:opacity-90"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DraggableWidget>
            );
          }
          
          // Daily Stats Widget
          if (widgetId === 'dailyStats') {
            return (
              <DraggableWidget key={widgetId} widgetId={widgetId} layout={layout}>
                <Card variant="elevated" className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BarChart3 size={20} className="text-theme-primary" />
                      <CardTitle>Daily Stats</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-theme-surface-elevated rounded-lg">
                        <div>
                          <div className="text-sm text-theme-secondary">Tasks Completed</div>
                          <div className="text-2xl font-bold text-theme-primary">{dailyStatsData.tasksCompleted}</div>
                        </div>
                        <CheckSquare size={24} className="text-theme-primary" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-theme-surface-elevated rounded-lg">
                        <div>
                          <div className="text-sm text-theme-secondary">Tasks Created</div>
                          <div className="text-2xl font-bold text-theme-primary">{dailyStatsData.tasksCreated}</div>
                        </div>
                        <Plus size={24} className="text-theme-primary" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-theme-surface-elevated rounded-lg">
                        <div>
                          <div className="text-sm text-theme-secondary">Time Spent</div>
                          <div className="text-2xl font-bold text-theme-primary">{dailyStatsData.timeSpent}</div>
                        </div>
                        <Clock size={24} className="text-theme-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DraggableWidget>
            );
          }
          
          // Weather Widget
          if (widgetId === 'weather') {
            const weatherData = {
              temp: 72,
              condition: 'Sunny',
              location: 'New York, NY',
              high: 75,
              low: 65,
            };
            
            return (
              <DraggableWidget key={widgetId} widgetId={widgetId} layout={layout}>
                <Card variant="elevated" className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Cloud size={20} className="text-theme-primary" />
                      <CardTitle>Weather</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-theme-primary">{weatherData.temp}°F</div>
                        <div className="text-lg text-theme-secondary mt-1">{weatherData.condition}</div>
                        <div className="text-sm text-theme-tertiary mt-1">{weatherData.location}</div>
                      </div>
                      <div className="flex justify-between pt-4 border-t border-theme-light">
                        <div className="text-center">
                          <div className="text-xs text-theme-secondary">High</div>
                          <div className="text-lg font-semibold text-theme-primary">{weatherData.high}°</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-theme-secondary">Low</div>
                          <div className="text-lg font-semibold text-theme-primary">{weatherData.low}°</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DraggableWidget>
            );
          }
          
          // Custom Widget
          if (widgetId === 'custom') {
            // For custom widgets, we need to find or create a unique instance ID
            // Since there can be multiple custom widgets, we'll use a simpler approach
            // Each custom widget instance will be identified by a unique ID stored in layout metadata
            // For now, let's use the first available custom widget or create a new one
            const customWidgetIds = Object.keys(customWidgets);
            const customWidgetId = customWidgetIds.length > 0 ? customWidgetIds[0] : `custom_${Date.now()}`;
            const customWidget = customWidgets[customWidgetId];
            
            return (
              <DraggableWidget key={widgetId} widgetId={widgetId} layout={layout}>
                <Card variant="elevated" className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code size={20} className="text-theme-primary" />
                        <CardTitle>{customWidget?.title || 'Custom Widget'}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCustomWidget({ 
                            id: customWidgetId, 
                            title: customWidget?.title || 'My Custom Widget',
                            html: customWidget?.html || '',
                            css: customWidget?.css || ''
                          });
                          setIsCustomWidgetEditorOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {customWidget?.html ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: `<style>${customWidget.css || ''}</style>${customWidget.html}` }}
                        className="custom-widget-content"
                      />
                    ) : (
                      <div className="text-center py-8 text-theme-secondary">
                        <Code size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="mb-4">No content yet. Click "Edit" to create your custom widget.</p>
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCustomWidget({ 
                              id: customWidgetId, 
                              title: 'My Custom Widget',
                              html: '',
                              css: ''
                            });
                            setIsCustomWidgetEditorOpen(true);
                          }}
                        >
                          Create Widget
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </DraggableWidget>
            );
          }
          
          // Quick Actions Widget
          if (widgetId === 'quickActions') {
            const actions = [
              { icon: Plus, label: 'New Task', url: '/tasks' },
              { icon: Link2, label: 'Add Tool', url: '/tools' },
              { icon: CalendarIcon, label: 'Schedule Leave', url: '/leave-schedule' },
              { icon: CheckSquare, label: 'View Tasks', url: '/tasks' },
            ];
            
            return (
              <DraggableWidget key={widgetId} widgetId={widgetId} layout={layout}>
                <Card variant="elevated" className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Zap size={20} className="text-theme-primary" />
                      <CardTitle>Quick Actions</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {actions.map((action, idx) => (
                        <Link
                          key={idx}
                          to={action.url}
                          className="flex flex-col items-center justify-center p-4 rounded-lg bg-theme-surface-elevated hover:bg-opacity-80 transition-colors"
                          onClick={(e) => draggedWidget && e.preventDefault()}
                        >
                          <action.icon size={24} className="text-theme-primary mb-2" />
                          <span className="text-sm text-theme-primary text-center">{action.label}</span>
                        </Link>
                      ))}
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
          <div className="bg-theme-surface rounded-xl shadow-elevated w-full max-w-xl border border-theme-light max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-theme-light">
              <h2 className="text-lg font-serif font-semibold text-theme-primary">Manage Widgets</h2>
              <button 
                onClick={() => setIsWidgetManagerOpen(false)} 
                className="p-2 text-theme-tertiary hover:text-theme-primary rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Active Widgets Section */}
              <div>
                <h3 className="text-base font-medium text-theme-primary mb-3">Active Widgets</h3>
                <div className="space-y-2">
                  {activeWidgets.map((widgetId) => {
                    const widget = WIDGET_REGISTRY[widgetId];
                    if (!widget) return null;
                    
                    return (
                      <div
                        key={widgetId}
                        className="flex items-center justify-between p-3 rounded-lg border border-theme-light hover:bg-theme-surface-elevated transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="p-1.5 bg-theme-surface-elevated rounded-lg shrink-0">
                            <widget.icon size={16} className="text-theme-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-theme-primary truncate">{widget.name}</p>
                            <p className="text-xs text-theme-secondary line-clamp-1">{widget.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => toggleWidgetVisibility(widgetId)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              widgetVisibility[widgetId]
                                ? 'text-theme-primary hover:bg-theme-primary/10'
                                : 'text-theme-tertiary hover:bg-theme-surface-elevated'
                            }`}
                            title={widgetVisibility[widgetId] ? 'Hide widget' : 'Show widget'}
                          >
                            {widgetVisibility[widgetId] ? (
                              <Eye size={16} />
                            ) : (
                              <EyeOff size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => removeWidget(widgetId)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Remove widget"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Widget Section */}
              <div className="pt-3 border-t border-theme-light">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-medium text-theme-primary">Available Widgets</h3>
                  <Button
                    onClick={() => setShowAddWidget(!showAddWidget)}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs px-3 py-1.5"
                  >
                    <Plus size={14} />
                    {showAddWidget ? 'Hide' : 'Show'} Available
                  </Button>
                </div>
                {showAddWidget && (
                  <div className="space-y-2">
                    {Object.values(WIDGET_REGISTRY)
                      .filter(widget => !activeWidgets.includes(widget.id))
                      .map((widget) => (
                        <div
                          key={widget.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-theme-light hover:bg-theme-surface-elevated transition-colors"
                        >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="p-1.5 bg-theme-surface-elevated rounded-lg shrink-0">
                            <widget.icon size={16} className="text-theme-primary" />
                          </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-theme-primary truncate">{widget.name}</p>
                              <p className="text-xs text-theme-secondary line-clamp-1">{widget.description}</p>
                              <p className="text-xs text-theme-tertiary mt-0.5">Category: {widget.category}</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => addWidget(widget.id)}
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs px-3 py-1.5 shrink-0"
                          >
                            <Plus size={14} />
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

              <div className="pt-3 border-t border-theme-light">
                <p className="text-xs text-theme-tertiary leading-relaxed">
                  Drag widgets to reposition them, and resize by dragging the corner handle. Hidden widgets remain on your dashboard but are not visible.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom Widget Editor Modal */}
      {isCustomWidgetEditorOpen && editingCustomWidget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface rounded-xl shadow-elevated w-full max-w-4xl border border-theme-light max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-theme-light">
              <h2 className="text-xl font-serif font-semibold text-theme-primary">Edit Custom Widget</h2>
              <button 
                onClick={() => {
                  setIsCustomWidgetEditorOpen(false);
                  setEditingCustomWidget(null);
                }}
                className="p-2 text-theme-tertiary hover:text-theme-primary rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-primary">Widget Title</label>
                  <input
                    type="text"
                    value={editingCustomWidget.title}
                    onChange={(e) => setEditingCustomWidget({ ...editingCustomWidget, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-theme-light bg-theme-background text-theme-primary"
                    placeholder="My Custom Widget"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-primary">HTML Content</label>
                  <textarea
                    value={editingCustomWidget.html}
                    onChange={(e) => setEditingCustomWidget({ ...editingCustomWidget, html: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-theme-light bg-theme-background text-theme-primary font-mono text-sm"
                    rows={12}
                    placeholder="<div>Your HTML content here...</div>"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-theme-primary">CSS Styles (Optional)</label>
                  <textarea
                    value={editingCustomWidget.css}
                    onChange={(e) => setEditingCustomWidget({ ...editingCustomWidget, css: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-theme-light bg-theme-background text-theme-primary font-mono text-sm"
                    rows={8}
                    placeholder=".my-widget { color: blue; }"
                  />
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Tip:</strong> You can use HTML and CSS to create custom widgets. The widget will render your HTML content with the CSS styles you provide.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-theme-light">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCustomWidgetEditorOpen(false);
                  setEditingCustomWidget(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const updatedWidgets = {
                    ...customWidgets,
                    [editingCustomWidget.id]: {
                      title: editingCustomWidget.title,
                      html: editingCustomWidget.html,
                      css: editingCustomWidget.css,
                    }
                  };
                  setCustomWidgets(updatedWidgets);
                  await saveCustomWidgets(updatedWidgets);
                  
                  // If this is a new widget being added, ensure it's in active widgets
                  if (!activeWidgets.includes('custom')) {
                    const newActiveWidgets: WidgetId[] = [...activeWidgets, 'custom'];
                    setActiveWidgets(newActiveWidgets);
                    await saveActiveWidgets(newActiveWidgets);
                  }
                  
                  setIsCustomWidgetEditorOpen(false);
                  setEditingCustomWidget(null);
                }}
              >
                Save Widget
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

