import { ThemeConfig, ThemeRegistry as ThemeRegistryInterface } from '../types';
import { eventBus } from './EventBus';

const STORAGE_KEY = 'theme';

const DEFAULT_THEME: ThemeConfig = {
  id: 'default',
  name: 'Default Light',
  description: 'Default light theme',
  colors: {
    primary: '#2563eb',
    secondary: '#7c3aed',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    accent: '#f59e0b',
    border: '#e5e7eb',
    muted: '#6b7280',
  },
  fonts: {
    sans: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, monospace',
    heading: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
  },
  radius: '0.5rem',
  mode: 'light',
};

function colorVars(config: ThemeConfig): Record<string, string> {
  return {
    '--color-primary': config.colors.primary,
    '--color-secondary': config.colors.secondary,
    '--color-background': config.colors.background,
    '--color-surface': config.colors.surface,
    '--color-text': config.colors.text,
    '--color-accent': config.colors.accent,
    '--color-border': config.colors.border,
    '--color-muted': config.colors.muted,
    '--font-sans': config.fonts.sans,
    '--font-mono': config.fonts.mono,
    '--font-heading': config.fonts.heading,
    '--radius': config.radius,
  };
}

class ThemeRegistryImpl implements ThemeRegistryInterface {
  private themes = new Map<string, ThemeConfig>();

  constructor() {
    this.themes.set(DEFAULT_THEME.id, DEFAULT_THEME);
  }

  register(theme: ThemeConfig): void {
    const isNew = !this.themes.has(theme.id);
    this.themes.set(theme.id, theme);
    if (isNew) {
      eventBus.emit('theme:registered', theme);
    }
  }

  unregister(themeId: string): void {
    if (themeId === DEFAULT_THEME.id) return;
    if (this.themes.has(themeId)) {
      this.themes.delete(themeId);
      eventBus.emit('theme:unregistered', themeId);
      if (this.getActive().id === themeId) {
        this.apply(DEFAULT_THEME.id);
      }
    }
  }

  get(themeId: string): ThemeConfig | undefined {
    return this.themes.get(themeId);
  }

  getAll(): ThemeConfig[] {
    return Array.from(this.themes.values());
  }

  getActive(): ThemeConfig {
    let id = DEFAULT_THEME.id;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && this.themes.has(saved)) {
        id = saved;
      }
    } catch {
      id = DEFAULT_THEME.id;
    }
    return this.themes.get(id) || DEFAULT_THEME;
  }

  setActive(themeId: string): void {
    if (!this.themes.has(themeId)) return;
    this.apply(themeId);
  }

  apply(themeId: string): void {
    const theme = this.themes.get(themeId);
    if (!theme) return;
    const vars = colorVars(theme);
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.setAttribute('data-theme', theme.id);
    root.classList.toggle('dark', theme.mode === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, themeId);
    } catch {
      // ignore
    }
    eventBus.emit('theme:changed', theme);
  }
}

export const themeRegistry = new ThemeRegistryImpl();
export { DEFAULT_THEME };
