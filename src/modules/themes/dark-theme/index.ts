import { ModuleInstance, ModuleManifest, ThemeConfig } from '../../../types';
import { coreFramework } from '../../../core/CoreFramework';

const theme: ThemeConfig = {
  id: 'dark',
  name: 'Dark',
  description: 'Dark theme for low-light environments',
  colors: {
    primary: '#3b82f6',
    secondary: '#a78bfa',
    background: '#111827',
    surface: '#1f2937',
    text: '#f9fafb',
    accent: '#fbbf24',
    border: '#374151',
    muted: '#9ca3af',
  },
  fonts: {
    sans: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, monospace',
    heading: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
  },
  radius: '0.5rem',
  mode: 'dark',
};


import manifestRaw from './manifest.json';
const manifest: ModuleManifest = manifestRaw as ModuleManifest;
let instance: ModuleInstance | null = null;

const darkThemeModule: ModuleInstance = {
  manifest,
  initialize(core) {
    instance = darkThemeModule;
    core.registerModule(darkThemeModule);
    if (manifest.theme) core.theme.register(manifest.theme);
    return Promise.resolve();
  },
  destroy() {
    if (instance) {
      coreFramework.unregisterModule(darkThemeModule.manifest.id);
      coreFramework.theme.unregister('dark');
      instance = null;
    }
    return Promise.resolve();
  },
  getRoutes() { return []; },
  getTopbarItems() { return []; },
  getSidebarItems() { return []; },
};

export { darkThemeModule, manifest, theme };
export default darkThemeModule;
