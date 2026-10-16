import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { coreFramework } from '../core/CoreFramework';
import { ThemeConfig } from '../types';

interface ThemeContextValue {
  themes: ThemeConfig[];
  activeTheme: ThemeConfig;
  setActiveTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themes, setThemes] = useState<ThemeConfig[]>(() => coreFramework.theme.getAll());
  const [activeTheme, setActiveThemeState] = useState<ThemeConfig>(() => coreFramework.theme.getActive());

  useEffect(() => {
    const syncThemes = () => setThemes(coreFramework.theme.getAll());
    const syncActive = () => setActiveThemeState(coreFramework.theme.getActive());

    const unsubRegistered = coreFramework.eventBus.on('theme:registered', syncThemes);
    const unsubUnregistered = coreFramework.eventBus.on('theme:unregistered', syncThemes);
    const unsubChanged = coreFramework.eventBus.on('theme:changed', () => {
      syncThemes();
      syncActive();
    });

    // Apply initial theme on mount
    coreFramework.theme.apply(activeTheme.id);

    return () => {
      unsubRegistered();
      unsubUnregistered();
      unsubChanged();
    };
  }, []);

  const setActiveTheme = (themeId: string) => {
    coreFramework.theme.setActive(themeId);
    setActiveThemeState(coreFramework.theme.getActive());
  };

  return (
    <ThemeContext.Provider value={{ themes, activeTheme, setActiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
