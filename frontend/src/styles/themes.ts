// Theme configuration with 5 color schemes

export interface Theme {
  name: string;
  label: string;
  colors: {
    // Background colors
    background: string;
    surface: string;
    surfaceElevated: string;
    
    // Text colors
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    
    // Primary/Accent colors
    primary: string;
    primaryHover: string;
    primaryLight: string;
    
    // Border colors
    border: string;
    borderLight: string;
    
    // Status colors
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export const themes: Record<string, Theme> = {
  // 1. Default Light Mode (Black & Dark Grey)
  light: {
    name: 'light',
    label: '☀️ Light Mode',
    colors: {
      background: '#f5f5f5',      // Light grey background
      surface: '#ffffff',         // White surface
      surfaceElevated: '#4a4a4a', // Dark grey for hover
      
      textPrimary: '#000000',      // Pure black for primary text
      textSecondary: '#1a1a1a',    // Very dark grey for secondary text (darker)
      textTertiary: '#2d2d2d',     // Dark grey for tertiary text (darker)
      
      primary: '#2d2d2d',          // Dark grey for primary elements
      primaryHover: '#1a1a1a',    // Darker grey on hover
      primaryLight: '#e5e5e5',    // Light grey for light elements
      
      border: '#d3d3d3',           // Light grey borders
      borderLight: '#e5e5e5',      // Very light grey borders
      
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },

  // 2. Dark Mode (Netflix Inspired)
  dark: {
    name: 'dark',
    label: '🌙 Dark Mode',
    colors: {
      background: '#000000',      // Pure Black
      surface: '#141414',         // Netflix-style surface
      surfaceElevated: '#2a2a2a', // Slightly lighter surface
      
      textPrimary: '#ffffff',     // Pure white for text
      textSecondary: '#b3b3b3',   // Muted gray text
      textTertiary: '#808080',    // More muted gray
      
      primary: '#e50914',         // Netflix Red
      primaryHover: '#f40612',    // Slightly brighter red
      primaryLight: '#333333',    // Dark gray for sub-elements
      
      border: '#333333',          // Darker borders
      borderLight: '#222222',     // Very subtle borders
      
      success: '#46d369',         // Netflix-style green
      warning: '#ffa00a',         // Netflix-style yellow/orange
      error: '#e50914',           // Netflix Red for errors too
      info: '#0071eb',            // Standard bright blue
    },
  },

  // 3. Ocean Blue
  ocean: {
    name: 'ocean',
    label: '🌊 Ocean Blue',
    colors: {
      background: '#f5f5f5',      // Light gray from bottom of gradient
      surface: '#ffffff',
      surfaceElevated: '#14b8a6', // Turquoise background for hover
      
      textPrimary: '#115e67',      // Dark teal from top of gradient
      textSecondary: '#0e7490',    // Medium teal
      textTertiary: '#64748b',     // Gray-blue
      
      primary: '#115e67',          // Dark teal (matching textPrimary for buttons)
      primaryHover: '#0d4a52',     // Darker teal for hover
      primaryLight: '#ccfbf1',     // Light teal tint
      
      border: '#5eead4',           // Light turquoise border
      borderLight: '#99f6e4',      // Very light turquoise
      
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
    },
  },

  // 4. MetroShoe (Inspired by attached logo)
  metro: {
    name: 'metro',
    label: '👟 MetroShoe',
    colors: {
      background: '#ffffff',      // Pure white
      surface: '#ffffff',         // White surface
      surfaceElevated: '#82af2b', // Darker Yellow Green for category badges
      
      textPrimary: '#332d2b',     // Dark brownish gray from logo text
      textSecondary: '#6b6b6b',   // Medium gray
      textTertiary: '#9ca3af',    // Light gray
      
      primary: '#7ab02c',         // MetroShoe Green
      primaryHover: '#6a9d26',    // Darker green
      primaryLight: '#f1f8e9',    // Very light green tint
      
      border: '#e0e0e0',          // Standard light border
      borderLight: '#f5f5f5',     // Very light border
      
      success: '#7ab02c',         // Use Metro green for success too
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#82af2b',            // Darker Yellow Green for Personal Tool badges
    },
  },

  // 5. Sunset Orange (Alibaba Inspired)
  sunset: {
    name: 'sunset',
    label: '🌅 Sunset',
    colors: {
      background: '#fff9f5',      // Very light orange background
      surface: '#ffffff',         // White surface
      surfaceElevated: '#ff6600', // Orange background for hover
      
      textPrimary: '#333333',     // Dark gray text
      textSecondary: '#666666',   // Medium gray text
      textTertiary: '#999999',    // Light gray text
      
      primary: '#ff6600',         // Alibaba Orange
      primaryHover: '#e65c00',    // Darker orange
      primaryLight: '#fff0e6',    // Very light orange tint
      
      border: '#ffd9cc',          // Light orange-tinted border
      borderLight: '#f2f2f2',     // Standard light gray border
      
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
};

export type ThemeName = keyof typeof themes;

export const themeNames: ThemeName[] = ['light', 'dark', 'ocean', 'metro', 'sunset'];

