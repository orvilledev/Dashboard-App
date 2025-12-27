import { useState, useEffect, useRef } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { themes, themeNames } from '@/styles/themes';
import type { ThemeName } from '@/styles/themes';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get button position for fixed positioning when dropdown opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  }, [isOpen]);

  const handleThemeChange = (themeName: ThemeName) => {
    setTheme(themeName);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Theme Toggle Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-500 transition-colors"
        title="Change theme"
        aria-label="Change theme"
      >
        <Palette size={20} className="text-current" />
      </button>

      {/* Theme Selector Dropdown */}
      {isOpen && buttonRect && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown - positioned with fixed to appear on top of everything */}
          <div 
            className="fixed w-72 z-[101] rounded-xl shadow-elevated border p-4 space-y-2"
            style={{
              left: `${buttonRect.right + 8}px`,
              bottom: `${window.innerHeight - buttonRect.bottom}px`,
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <h3 
              className="font-semibold text-base mb-3 font-serif"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Choose Theme
            </h3>
            <div className="space-y-2">
              {themeNames.map((themeName) => {
                const themeColors = themes[themeName].colors;
                const isSelected = theme === themeName;
                
                return (
                  <button
                    key={themeName}
                    onClick={() => handleThemeChange(themeName)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg transition-all border-2 hover:opacity-90"
                    style={{
                      borderColor: isSelected ? themeColors.primary : themeColors.border,
                      backgroundColor: isSelected ? themeColors.primaryLight : themeColors.surface,
                    }}
                  >
                    {/* Theme Preview Card */}
                    <div 
                      className="relative w-12 h-12 rounded-lg border-2 flex-shrink-0 overflow-hidden shadow-sm"
                      style={{ 
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.border,
                      }}
                    >
                      {/* Preview content showing theme colors */}
                      <div className="absolute inset-0 flex flex-col">
                        <div 
                          className="h-3" 
                          style={{ backgroundColor: themeColors.surface }}
                        />
                        <div className="flex-1 flex items-center justify-center gap-0.5 p-0.5">
                          <div 
                            className="w-1.5 h-1.5 rounded-full" 
                            style={{ backgroundColor: themeColors.primary }}
                          />
                          <div 
                            className="w-1 h-1 rounded-full" 
                            style={{ backgroundColor: themeColors.textSecondary }}
                          />
                          <div 
                            className="w-0.5 h-0.5 rounded-full" 
                            style={{ backgroundColor: themeColors.textTertiary }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Theme Info */}
                    <div className="flex-1 text-left">
                      <div 
                        className="font-medium text-sm"
                        style={{ color: themeColors.textPrimary }}
                      >
                        {themes[themeName].label}
                      </div>
                      <div 
                        className="text-xs mt-0.5"
                        style={{ color: themeColors.textSecondary }}
                      >
                        {themeName === 'light' && 'Default light theme'}
                        {themeName === 'dark' && 'Dark mode'}
                        {themeName === 'ocean' && 'Cool blue tones'}
                        {themeName === 'metro' && 'MetroShoe scheme'}
                        {themeName === 'sunset' && 'Warm orange'}
                      </div>
                    </div>
                    
                    {/* Selected Indicator */}
                    {isSelected && (
                      <div 
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: themeColors.primary }}
                      >
                        <Check size={14} style={{ color: themeColors.surface }} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
