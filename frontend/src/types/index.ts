/**
 * Shared TypeScript type definitions
 */

// User types
export interface User {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  is_admin: boolean;
  created_at?: string;
}

// Tool types
export interface Tool {
  id: number;
  name: string;
  url: string;
  description: string;
  category: string;
  icon_url?: string;
  is_active: boolean;
  is_personal: boolean;
  is_favorite?: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// Task types
export interface Task {
  id: number;
  title: string;
  description: string;
  link?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_by?: number;
  assignee?: number;
  parent_task?: number;
  subtasks?: Task[];
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  archived_at?: string;
}

// Team types
export interface Team {
  id: number;
  name: string;
  description: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: number;
  team: number;
  user: User;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface TeamInvite {
  id: number;
  team: number;
  email: string;
  invited_by?: number;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  created_at: string;
  expires_at?: string;
}

// Document types
export interface Document {
  id: number;
  name: string;
  description: string;
  file_key: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  status: 'pending' | 'uploaded' | 'processing' | 'ready' | 'error';
  is_shared: boolean;
  uploaded_by?: number;
  shared_with?: number[];
  created_at: string;
  updated_at: string;
}

// User Preferences types
export interface UserPreferences {
  tools_category_order: string[];
  tools_category_labels: Record<string, string>;
  tools_category_colors: Record<string, string>;
  theme: 'light' | 'dark' | 'ocean' | 'metro' | 'sunset';
  dashboard_layout: Record<string, { x: number; y: number; width: number; height: number }>;
  dashboard_widget_visibility: Record<string, boolean>;
  dashboard_active_widgets: string[];
  clock_widget_timezones: Record<string, string>;
  mood_widget_current?: string;
  mood_widget_history: Array<{ date: string; mood: string }>;
  custom_widgets: Record<string, { title: string; html: string; css: string }>;
}

// API Response types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  error?: string;
  detail?: string;
  message?: string;
  [key: string]: any;
}

// Widget types
export type WidgetId = 
  | 'openTasks'
  | 'quote'
  | 'recentActivity'
  | 'clock'
  | 'mood'
  | 'notes'
  | 'calendar'
  | 'timer'
  | 'calculator'
  | 'quickLinks'
  | 'goals'
  | 'pomodoro'
  | 'dailyStats'
  | 'custom';

export interface WidgetDefinition {
  id: WidgetId;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  defaultSize: { width: number; height: number };
  category: string;
}

