import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { themes, themeNames, type CustomThemeColors, type ThemeName } from '@/styles/themes';
import { Palette, Check, Save, RotateCcw, Edit2, Trash2, Plus } from 'lucide-react';
import { api } from '@/api';
import { useAuth } from '@clerk/clerk-react';

interface SavedCustomTheme {
  id: string;
  name: string;
  colors: CustomThemeColors;
  created_at?: string;
  updated_at?: string;
}

export function ThemeSettingsPage() {
  const { theme, setTheme, applyTheme } = useTheme();
  const { isSignedIn, getToken } = useAuth();
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [themeName, setThemeName] = useState('');
  const [savedThemes, setSavedThemes] = useState<Record<string, SavedCustomTheme>>({});
  const [customColors, setCustomColors] = useState<CustomThemeColors>(() => {
    // Default custom theme colors (based on light theme)
    return {
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
    };
  });

  // Load saved custom themes from backend or localStorage
  useEffect(() => {
    const loadSavedThemes = async () => {
      if (isSignedIn) {
        try {
          const token = await getToken();
          if (token) {
            const preferences = await api.get<{ custom_themes?: Record<string, SavedCustomTheme> }>('/users/preferences/', token);
            if (preferences?.custom_themes) {
              setSavedThemes(preferences.custom_themes);
              // Also save to localStorage for offline access
              localStorage.setItem('amzpulse-custom-themes', JSON.stringify(preferences.custom_themes));
            } else {
              // If no themes in backend, try localStorage
              try {
                const saved = localStorage.getItem('amzpulse-custom-themes');
                if (saved) {
                  const themes = JSON.parse(saved);
                  setSavedThemes(themes);
                }
              } catch (e) {
                console.warn('Failed to load from localStorage:', e);
              }
            }
          }
        } catch (error) {
          console.warn('Failed to load custom themes from backend:', error);
          // Fallback to localStorage
          try {
            const saved = localStorage.getItem('amzpulse-custom-themes');
            if (saved) {
              setSavedThemes(JSON.parse(saved));
            }
          } catch (e) {
            console.warn('Failed to load from localStorage:', e);
          }
        }
      } else {
        // For non-signed-in users, load from localStorage
        try {
          const saved = localStorage.getItem('amzpulse-custom-themes');
          if (saved) {
            setSavedThemes(JSON.parse(saved));
          }
        } catch (error) {
          console.warn('Failed to load custom themes from localStorage:', error);
        }
      }
    };
    loadSavedThemes();
  }, [isSignedIn, getToken]);

  // Load theme colors when a saved theme is selected
  useEffect(() => {
    if (theme.startsWith('custom:')) {
      const themeId = theme.replace('custom:', '');
      const savedTheme = savedThemes[themeId];
      if (savedTheme) {
        setCustomColors(savedTheme.colors);
        applyCustomTheme(savedTheme.colors);
      } else {
        // Try to load from localStorage if not in state
        try {
          const saved = localStorage.getItem('amzpulse-custom-themes');
          if (saved) {
            const themes = JSON.parse(saved);
            if (themes[themeId]) {
              setSavedThemes(themes);
              setCustomColors(themes[themeId].colors);
              applyCustomTheme(themes[themeId].colors);
            }
          }
        } catch (error) {
          console.warn('Failed to load theme from localStorage:', error);
        }
      }
    }
  }, [theme, savedThemes]);

  const applyCustomTheme = (colors: CustomThemeColors) => {
    const root = document.documentElement;
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-surface-elevated', colors.surfaceElevated);
    root.style.setProperty('--color-text-primary', colors.textPrimary);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-text-tertiary', colors.textTertiary);
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-hover', colors.primaryHover);
    root.style.setProperty('--color-primary-light', colors.primaryLight);
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-border-light', colors.borderLight);
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-error', colors.error);
    root.style.setProperty('--color-info', colors.info);
  };

  const handleThemeSelect = async (themeName: ThemeName) => {
    // Apply the theme immediately
    setTheme(themeName);
    
    // Save theme selection to backend if signed in
    if (isSignedIn) {
      try {
        const token = await getToken();
        if (token) {
          await api.post('/users/update_preferences/', {
            theme: themeName
          }, token).catch(err => {
            console.warn('Failed to save theme selection to backend:', err);
          });
        }
      } catch (error) {
        console.warn('Failed to save theme selection:', error);
      }
    }
    
    setIsCustomOpen(false);
    setIsCreatingNew(false);
    setEditingThemeId(null);
  };

  const handleSelectSavedTheme = async (themeId: string) => {
    const savedTheme = savedThemes[themeId];
    if (!savedTheme) return;

    // Apply the theme immediately
    applyCustomTheme(savedTheme.colors);
    setTheme(`custom:${themeId}` as ThemeName);
    
    // Save theme selection to backend if signed in
    if (isSignedIn) {
      try {
        const token = await getToken();
        if (token) {
          await api.post('/users/update_preferences/', {
            theme: `custom:${themeId}`
          }, token).catch(err => {
            console.warn('Failed to save theme selection to backend:', err);
          });
        }
      } catch (error) {
        console.warn('Failed to save theme selection:', error);
      }
    }
    
    setIsCustomOpen(false);
    setIsCreatingNew(false);
    setEditingThemeId(null);
  };

  const handleEditTheme = (themeId: string) => {
    const savedTheme = savedThemes[themeId];
    if (savedTheme) {
      setCustomColors(savedTheme.colors);
      setThemeName(savedTheme.name);
      setEditingThemeId(themeId);
      setIsCreatingNew(false);
      setIsCustomOpen(true);
      // Apply immediately so user sees changes on the actual page
      applyCustomTheme(savedTheme.colors);
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!confirm('Are you sure you want to delete this theme?')) return;

    // Update local state
    const newThemes = { ...savedThemes };
    delete newThemes[themeId];
    setSavedThemes(newThemes);
    
    // Update localStorage
    localStorage.setItem('amzpulse-custom-themes', JSON.stringify(newThemes));

    if (isSignedIn) {
      try {
        const token = await getToken();
        if (token) {
          await api.post('/users/update_preferences/', { 
            delete_custom_theme: themeId 
          }, token);
        }
      } catch (error) {
        console.error('Failed to delete theme from backend:', error);
        // Don't show error - already deleted locally
      }
    }
    
    // If deleted theme was active, switch to light
    if (theme === `custom:${themeId}`) {
      setTheme('light');
    }
  };

  const handleColorChange = (key: keyof CustomThemeColors, value: string) => {
    const newColors = { ...customColors, [key]: value };
    setCustomColors(newColors);
    
    // Always apply colors immediately to the actual page
    applyCustomTheme(newColors);
  };

  const handleStartCreating = () => {
    setIsCreatingNew(true);
    setIsCustomOpen(true);
    setEditingThemeId(null);
    setThemeName('');
    // Reset to default colors
    const defaultColors = {
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
    };
    setCustomColors(defaultColors);
    // Apply immediately so user sees changes on the actual page
    applyCustomTheme(defaultColors);
  };

  const handleSaveCustomTheme = async () => {
    if (!themeName.trim()) {
      alert('Please enter a name for your theme');
      return;
    }

    const themeId = editingThemeId || `theme_${Date.now()}`;
    const newTheme: SavedCustomTheme = {
      id: themeId,
      name: themeName.trim(),
      colors: customColors,
      updated_at: new Date().toISOString()
    };

    if (isSignedIn) {
      try {
        const token = await getToken();
        if (token) {
          // Save theme to backend
          await api.post('/users/update_preferences/', { 
            save_custom_theme: {
              id: themeId,
              name: themeName.trim(),
              colors: customColors
            }
          }, token);
          
          // Also update theme selection to use this custom theme
          await api.post('/users/update_preferences/', {
            theme: `custom:${themeId}`
          }, token);
          
          // Update local state
          const updatedThemes = {
            ...savedThemes,
            [themeId]: newTheme
          };
          setSavedThemes(updatedThemes);
          
          // Update localStorage
          localStorage.setItem('amzpulse-custom-themes', JSON.stringify(updatedThemes));
          
          // Apply the theme
          setTheme(`custom:${themeId}` as ThemeName);
          applyCustomTheme(customColors);
          
          // Close the editor
          setIsCustomOpen(false);
          setIsCreatingNew(false);
          setEditingThemeId(null);
          setThemeName('');
        }
      } catch (error) {
        console.error('Failed to save theme:', error);
        alert('Failed to save theme. Please try again.');
      }
    } else {
      // For non-signed-in users, save to localStorage
      const updatedThemes = {
        ...savedThemes,
        [themeId]: newTheme
      };
      setSavedThemes(updatedThemes);
      localStorage.setItem('amzpulse-custom-themes', JSON.stringify(updatedThemes));
      
      // Apply the theme
      setTheme(`custom:${themeId}` as ThemeName);
      applyCustomTheme(customColors);
      
      // Close the editor
      setIsCustomOpen(false);
      setIsCreatingNew(false);
      setEditingThemeId(null);
      setThemeName('');
    }
  };

  const handleResetCustomTheme = () => {
    const defaultColors: CustomThemeColors = {
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
    };
    setCustomColors(defaultColors);
    if (theme.startsWith('custom:')) {
      applyCustomTheme(defaultColors);
    }
  };

  const colorPickerGroups = [
    {
      title: 'Background Colors',
      colors: [
        { key: 'background' as const, label: 'Background', description: 'Main page background' },
        { key: 'surface' as const, label: 'Surface', description: 'Card and panel backgrounds' },
        { key: 'surfaceElevated' as const, label: 'Elevated Surface', description: 'Hovered or active elements' },
      ],
    },
    {
      title: 'Text Colors',
      colors: [
        { key: 'textPrimary' as const, label: 'Primary Text', description: 'Main headings and important text' },
        { key: 'textSecondary' as const, label: 'Secondary Text', description: 'Body text and descriptions' },
        { key: 'textTertiary' as const, label: 'Tertiary Text', description: 'Subtle text and hints' },
      ],
    },
    {
      title: 'Primary Colors',
      colors: [
        { key: 'primary' as const, label: 'Primary', description: 'Main accent color for buttons and links' },
        { key: 'primaryHover' as const, label: 'Primary Hover', description: 'Hover state for primary elements' },
        { key: 'primaryLight' as const, label: 'Primary Light', description: 'Light tint for primary elements' },
      ],
    },
    {
      title: 'Border Colors',
      colors: [
        { key: 'border' as const, label: 'Border', description: 'Standard borders and dividers' },
        { key: 'borderLight' as const, label: 'Border Light', description: 'Subtle borders' },
      ],
    },
    {
      title: 'Status Colors',
      colors: [
        { key: 'success' as const, label: 'Success', description: 'Success messages and indicators' },
        { key: 'warning' as const, label: 'Warning', description: 'Warning messages and alerts' },
        { key: 'error' as const, label: 'Error', description: 'Error messages and destructive actions' },
        { key: 'info' as const, label: 'Info', description: 'Informational messages and badges' },
      ],
    },
  ];

  const savedThemesArray = Object.values(savedThemes);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Theme Settings
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Customize the appearance of your workspace with predefined themes or create your own personalized color schemes
        </p>
      </div>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette size={20} strokeWidth={1.5} />
            Choose a Theme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {themeNames.filter(name => name !== 'custom').map((themeName) => {
              const themeData = themes[themeName];
              const isSelected = theme === themeName;
              
              return (
                <button
                  key={themeName}
                  onClick={() => handleThemeSelect(themeName)}
                  className="relative p-4 rounded-xl border-2 transition-all text-left hover:shadow-md"
                  style={{
                    borderColor: isSelected ? themeData.colors.primary : 'var(--color-border)',
                    backgroundColor: isSelected ? themeData.colors.primaryLight : 'var(--color-surface)',
                  }}
                >
                  {isSelected && (
                    <div 
                      className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: themeData.colors.primary }}
                    >
                      <Check size={14} style={{ color: themeData.colors.surface }} strokeWidth={3} />
                    </div>
                  )}
                  
                  {/* Theme Preview */}
                  <div 
                    className="w-full h-20 rounded-lg mb-3 border-2 overflow-hidden"
                    style={{ 
                      backgroundColor: themeData.colors.background,
                      borderColor: themeData.colors.border,
                    }}
                  >
                    <div className="h-full flex flex-col">
                      <div 
                        className="h-4"
                        style={{ backgroundColor: themeData.colors.surface }}
                      />
                      <div className="flex-1 flex items-center justify-center gap-2 p-2">
                        <div 
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: themeData.colors.primary }}
                        />
                        <div 
                          className="flex-1 h-4 rounded"
                          style={{ backgroundColor: themeData.colors.surfaceElevated }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Theme Info */}
                  <div>
                    <h3 
                      className="font-semibold text-lg mb-1"
                      style={{ color: themeData.colors.textPrimary }}
                    >
                      {themeData.label}
                    </h3>
                    <p 
                      className="text-sm leading-relaxed"
                      style={{ color: themeData.colors.textSecondary }}
                    >
                      {themeData.description}
                    </p>
                  </div>
                </button>
              );
            })}
            
            {/* Custom Theme Option */}
            <button
              onClick={handleStartCreating}
              className="relative p-4 rounded-xl border-2 transition-all text-left hover:shadow-md border-dashed"
              style={{
                borderColor: theme.startsWith('custom:') ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: theme.startsWith('custom:') ? 'var(--color-primary-light)' : 'var(--color-surface)',
              }}
            >
              {theme.startsWith('custom:') && (
                <div 
                  className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Check size={14} style={{ color: 'var(--color-surface)' }} strokeWidth={3} />
                </div>
              )}
              
              {/* Custom Theme Preview */}
              <div 
                className="w-full h-20 rounded-lg mb-3 border-2 overflow-hidden"
                style={{ 
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="h-full flex flex-col">
                  <div 
                    className="h-4"
                    style={{ backgroundColor: 'var(--color-surface)' }}
                  />
                  <div className="flex-1 flex items-center justify-center gap-2 p-2">
                    <div 
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    />
                    <div 
                      className="flex-1 h-4 rounded"
                      style={{ backgroundColor: 'var(--color-surface-elevated)' }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Custom Theme Info */}
              <div>
                <h3 
                  className="font-semibold text-lg mb-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  🎨 Custom Theme
                </h3>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Create your own personalized color scheme by customizing every element of the interface to match your preferences.
                </p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Saved Custom Themes */}
      {savedThemesArray.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette size={20} strokeWidth={1.5} />
              Your Custom Themes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedThemesArray.map((savedTheme) => {
                const isSelected = theme === `custom:${savedTheme.id}`;
                
                return (
                  <div
                    key={savedTheme.id}
                    className="relative p-4 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                    }}
                  >
                    {isSelected && (
                      <div 
                        className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        <Check size={14} style={{ color: 'var(--color-surface)' }} strokeWidth={3} />
                      </div>
                    )}
                    
                    {/* Theme Preview */}
                    <div 
                      className="w-full h-16 rounded-lg mb-3 border-2 overflow-hidden cursor-pointer"
                      style={{ 
                        backgroundColor: savedTheme.colors.background,
                        borderColor: savedTheme.colors.border,
                      }}
                      onClick={() => handleSelectSavedTheme(savedTheme.id)}
                    >
                      <div className="h-full flex flex-col">
                        <div 
                          className="h-3"
                          style={{ backgroundColor: savedTheme.colors.surface }}
                        />
                        <div className="flex-1 flex items-center justify-center gap-1.5 p-1.5">
                          <div 
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: savedTheme.colors.primary }}
                          />
                          <div 
                            className="flex-1 h-3 rounded"
                            style={{ backgroundColor: savedTheme.colors.surfaceElevated }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Theme Name */}
                    <h3 
                      className="font-semibold text-base mb-2"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {savedTheme.name}
                    </h3>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSelectSavedTheme(savedTheme.id)}
                        className="flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors"
                        style={{
                          backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                          color: isSelected ? 'var(--color-surface)' : 'var(--color-text-primary)',
                          border: `1px solid var(--color-border)`,
                        }}
                      >
                        {isSelected ? 'Active' : 'Select'}
                      </button>
                      <button
                        onClick={() => handleEditTheme(savedTheme.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{
                          color: 'var(--color-text-secondary)',
                          border: `1px solid var(--color-border)`,
                        }}
                        title="Edit theme"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTheme(savedTheme.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{
                          color: 'var(--color-error)',
                          border: `1px solid var(--color-border)`,
                        }}
                        title="Delete theme"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Theme Color Picker */}
      {isCustomOpen && (
        <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette size={20} strokeWidth={1.5} />
                  {isCreatingNew ? 'Create New Theme' : editingThemeId ? 'Edit Theme' : 'Customize Your Theme'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
            {/* Theme Name Input */}
            <div>
              <Input
                label="Theme Name"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                placeholder="Enter a name for your theme"
                required
              />
            </div>

            {colorPickerGroups.map((group) => (
              <div key={group.title}>
                <h3 
                  className="font-semibold text-base mb-4"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {group.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.colors.map((color) => (
                    <div key={color.key} className="space-y-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {color.label}
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            value={customColors[color.key]}
                            onChange={(e) => handleColorChange(color.key, e.target.value)}
                            className="w-16 h-16 rounded-lg border-2 cursor-pointer transition-all"
                            style={{ 
                              borderColor: 'var(--color-border)',
                              backgroundColor: customColors[color.key],
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={customColors[color.key]}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                                handleColorChange(color.key, value);
                              }
                            }}
                            className="w-full px-3 py-2 rounded-lg border text-sm font-mono"
                            style={{
                              backgroundColor: 'var(--color-surface)',
                              color: 'var(--color-text-primary)',
                              borderColor: 'var(--color-border)',
                            }}
                            placeholder="#000000"
                          />
                          <p 
                            className="text-xs mt-1"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            {color.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <Button
                onClick={handleSaveCustomTheme}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Save size={16} />
                {editingThemeId ? 'Update Theme' : 'Save Theme'}
              </Button>
              <Button
                onClick={handleResetCustomTheme}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw size={16} />
                Reset Colors
              </Button>
              <Button
                onClick={() => {
                  setIsCustomOpen(false);
                  setIsCreatingNew(false);
                  setEditingThemeId(null);
                  setThemeName('');
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
