import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
export type FontSizeScale = 'normal' | 'large' | 'xl';

interface LandingThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  fontSize: FontSizeScale;
  setFontSize: (size: FontSizeScale) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  toggleHighContrast: () => void;
}

const LandingThemeContext = createContext<LandingThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'cordano_landing_theme';
const FONT_SIZE_STORAGE_KEY = 'cordano_landing_font_size';
const HIGH_CONTRAST_STORAGE_KEY = 'cordano_landing_high_contrast';

export const LandingThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to 'light' as requested by the user: "el modo principal es modo claro"
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [fontSize, setFontSizeState] = useState<FontSizeScale>(() => {
    const saved = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    return (saved === 'large' || saved === 'xl') ? saved : 'normal';
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem(HIGH_CONTRAST_STORAGE_KEY) === 'true';
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
  };

  const setFontSize = (size: FontSizeScale) => {
    setFontSizeState(size);
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, size);
  };

  const setHighContrast = (val: boolean) => {
    setHighContrastState(val);
    localStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, String(val));
  };

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
  };

  return (
    <LandingThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        toggleHighContrast
      }}
    >
      {children}
    </LandingThemeContext.Provider>
  );
};

export const useLandingTheme = (): LandingThemeContextType => {
  const context = useContext(LandingThemeContext);
  if (!context) {
    // Return fallback with light theme if not wrapped
    return {
      theme: 'light',
      setTheme: () => {},
      toggleTheme: () => {},
      fontSize: 'normal',
      setFontSize: () => {},
      highContrast: false,
      setHighContrast: () => {},
      toggleHighContrast: () => {}
    };
  }
  return context;
};
