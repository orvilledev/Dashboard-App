// Theme configuration with 3 color schemes

export interface Theme {
  name: string;
  label: string;
  description: string;
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
    description: 'A clean and minimal light theme with dark grey accents. Perfect for daytime use with excellent readability and reduced eye strain.',
    colors: {
      background: '#f5f5f5',      // Light grey background
      surface: '#ffffff',         // White surface
      surfaceElevated: '#4a4a4a', // Dark grey for hover
      
      textPrimary: '#000000',      // Pure black for primary text
      textSecondary: '#0d0c0c',    // Gray text color
      textTertiary: '#0d0c0c',     // Gray text color
      
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
    description: 'A sleek dark theme inspired by Netflix with deep blacks and vibrant red accents. Ideal for low-light environments and extended viewing sessions.',
    colors: {
      background: '#000000',      // Pure Black
      surface: '#141414',         // Netflix-style surface
      surfaceElevated: '#2a2a2a', // Slightly lighter surface
      
      textPrimary: '#ffffff',     // Pure white for text
      textSecondary: '#0d0c0c',   // Gray text color
      textTertiary: '#0d0c0c',    // Gray text color
      
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

  // 3. MetroShoe (Inspired by attached logo)
  metro: {
    name: 'metro',
    label: '👟 MetroShoe',
    description: 'A fresh and vibrant theme featuring MetroShoe\'s signature green palette on a clean white background. Brings energy and brand identity to your workspace.',
    colors: {
      background: '#ffffff',      // Pure white
      surface: '#ffffff',         // White surface
      surfaceElevated: '#82af2b', // Darker Yellow Green for category badges
      
      textPrimary: '#332d2b',     // Dark brownish gray from logo text
      textSecondary: '#0d0c0c',   // Gray text color
      textTertiary: '#0d0c0c',    // Gray text color
      
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

  // 4. Custom Theme (placeholder - actual colors loaded from localStorage/backend)
  custom: {
    name: 'custom',
    label: '🎨 Custom Theme',
    description: 'Create your own personalized color scheme',
    colors: {
      background: '#f5f5f5',
      surface: '#ffffff',
      surfaceElevated: '#4a4a4a',
      textPrimary: '#000000',
      textSecondary: '#0d0c0c',
      textTertiary: '#0d0c0c',
      primary: '#2d2d2d',
      primaryHover: '#1a1a1a',
      primaryLight: '#e5e5e5',
      border: '#d3d3d3',
      borderLight: '#e5e5e5',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
};

export type ThemeName = keyof typeof themes | `custom:${string}`;

export const themeNames: ThemeName[] = ['light', 'dark', 'metro', 'custom'];

// Custom theme interface for user-defined colors
export interface CustomThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  border: string;
  borderLight: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

