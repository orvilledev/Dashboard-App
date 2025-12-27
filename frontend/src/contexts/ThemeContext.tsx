import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { themes, themeNames } from '@/styles/themes';
import type { ThemeName } from '@/styles/themes';
import { api } from '@/api';

const THEME_STORAGE_KEY = 'amzpulse-theme';

// Helper to get saved theme from localStorage
function getSavedTheme(): ThemeName {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && themeNames.includes(saved as ThemeName)) {
      return saved as ThemeName;
    }
  } catch (error) {
    // localStorage might not be available
    console.warn('Could not read theme from localStorage:', error);
  }
  return 'light'; // Default fallback
}

// Helper to save theme to localStorage
function saveTheme(themeName: ThemeName): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeName);
  } catch (error) {
    console.warn('Could not save theme to localStorage:', error);
  }
}

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isLoading: boolean;
  applyTheme: (themeName: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  isLoading: false,
  applyTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  const [theme, setThemeState] = useState<ThemeName>(() => getSavedTheme());
  const [isLoading, setIsLoading] = useState(false);

  const applyTheme = useCallback((themeName: ThemeName) => {
    if (!themes[themeName]) return;
    
    const themeColors = themes[themeName].colors;
    const root = document.documentElement;

    // Apply CSS variables
    root.style.setProperty('--color-background', themeColors.background);
    root.style.setProperty('--color-surface', themeColors.surface);
    root.style.setProperty('--color-surface-elevated', themeColors.surfaceElevated);
    
    root.style.setProperty('--color-text-primary', themeColors.textPrimary);
    root.style.setProperty('--color-text-secondary', themeColors.textSecondary);
    root.style.setProperty('--color-text-tertiary', themeColors.textTertiary);
    
    root.style.setProperty('--color-primary', themeColors.primary);
    root.style.setProperty('--color-primary-hover', themeColors.primaryHover);
    root.style.setProperty('--color-primary-light', themeColors.primaryLight);
    
    root.style.setProperty('--color-border', themeColors.border);
    root.style.setProperty('--color-border-light', themeColors.borderLight);
    
    root.style.setProperty('--color-success', themeColors.success);
    root.style.setProperty('--color-warning', themeColors.warning);
    root.style.setProperty('--color-error', themeColors.error);
    root.style.setProperty('--color-info', themeColors.info);
    
    console.log(`Theme applied: ${themeName}`);
  }, []);

  // Apply saved theme on mount
  useEffect(() => {
    const savedTheme = getSavedTheme();
    setThemeState(savedTheme);
    applyTheme(savedTheme);
  }, [applyTheme]);

  // Load theme from backend when user signs in
  useEffect(() => {
    let isMounted = true;
    async function loadBackendTheme() {
      if (!isLoaded || !isSignedIn) return;

      try {
        const token = await getToken();
        if (!token || !isMounted) return;

        const preferences = await api.get<{ theme?: ThemeName }>('/users/preferences/', token);
        if (isMounted && preferences?.theme && themes[preferences.theme]) {
          setThemeState(preferences.theme);
          applyTheme(preferences.theme);
          saveTheme(preferences.theme);
        }
      } catch (error) {
        console.warn('Failed to load theme preferences from backend:', error);
      }
    }

    loadBackendTheme();
    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, getToken, applyTheme]); // Removed theme from dependencies to prevent race condition reversion

  const setTheme = useCallback(async (newTheme: ThemeName) => {
    // 1. Update state immediately for instant feedback
    setThemeState(newTheme);
    applyTheme(newTheme);
    
    // 2. Persist to localStorage
    saveTheme(newTheme);

    // 3. Sync with backend in the background if signed in
    if (isSignedIn) {
      try {
        const token = await getToken();
        if (token) {
          api.post('/users/update_preferences/', { theme: newTheme }, token).catch(err => {
            console.warn('Failed to save theme to backend:', err);
          });
        }
      } catch (error) {
        // Silently fail backend sync
      }
    }
  }, [isSignedIn, getToken, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
