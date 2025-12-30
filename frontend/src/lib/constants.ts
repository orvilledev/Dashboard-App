/**
 * Shared constants for the application
 */

export const API_ENDPOINTS = {
  USERS: {
    ME: '/users/me/',
    PREFERENCES: '/users/preferences/',
    UPDATE_PREFERENCES: '/users/update_preferences/',
    SEARCH: '/users/search/',
    UPLOAD_AVATAR: '/users/upload_avatar/',
  },
  TOOLS: {
    LIST: '/tools/',
    FAVORITES: '/tools/favorites/',
    CATEGORIES: '/tools/categories/',
    REORDER_FAVORITES: '/tools/reorder_favorites/',
  },
  TASKS: {
    LIST: '/tasks/',
    STATS: '/tasks/stats/',
    UPDATE_STATUS: (id: number) => `/tasks/${id}/update_status/`,
    SAVE_AS_TEMPLATE: (id: number) => `/tasks/${id}/save_as_template/`,
  },
  TEAMS: {
    LIST: '/teams/',
    MY_TEAMS: '/teams/my_teams/',
    MEMBERS: '/members/',
    INVITES: '/invites/',
    JOIN_REQUESTS: '/join_requests/',
  },
  DOCUMENTS: {
    LIST: '/documents/',
    REQUEST_UPLOAD: '/documents/request_upload/',
    CONFIRM_UPLOAD: (id: number) => `/documents/${id}/confirm_upload/`,
    DOWNLOAD_URL: (id: number) => `/documents/${id}/download_url/`,
    TOGGLE_SHARE: (id: number) => `/documents/${id}/toggle_share/`,
  },
} as const;

export const WIDGET_IDS = {
  OPEN_TASKS: 'openTasks',
  QUOTE: 'quote',
  RECENT_ACTIVITY: 'recentActivity',
  CLOCK: 'clock',
  MOOD: 'mood',
  NOTES: 'notes',
  CALENDAR: 'calendar',
  TIMER: 'timer',
  CALCULATOR: 'calculator',
  QUICK_LINKS: 'quickLinks',
  GOALS: 'goals',
  POMODORO: 'pomodoro',
  DAILY_STATS: 'dailyStats',
  CUSTOM: 'custom',
} as const;

export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const TOOL_CATEGORIES = {
  COMMUNICATION: 'communication',
  PRODUCTIVITY: 'productivity',
  DESIGN: 'design',
  DEVELOPMENT: 'development',
  PROJECT_MANAGEMENT: 'project_management',
  OTHER: 'other',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
} as const;

