import { ModuleInstance, ModuleManifest, ThemeConfig } from '../../../types';
import { coreFramework } from '../../../core/CoreFramework';

const theme: ThemeConfig = {
  id: 'default',
  name: 'Default Light',
  description: 'Default light theme for the application',
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


import manifestRaw from './manifest.json';
const manifest: ModuleManifest = manifestRaw as ModuleManifest;
let instance: ModuleInstance | null = null;

const defaultThemeModule: ModuleInstance = {
  manifest,
  initialize(core) {
    instance = defaultThemeModule;
    core.registerModule(defaultThemeModule);
    if (manifest.theme) core.theme.register(manifest.theme);
    return Promise.resolve();
  },
  destroy() {
    if (instance) {
      coreFramework.unregisterModule(defaultThemeModule.manifest.id);
      coreFramework.theme.unregister('default');
      instance = null;
    }
    return Promise.resolve();
  },
  getRoutes() { return []; },
  getTopbarItems() { return []; },
  getSidebarItems() { return []; },
};

export { defaultThemeModule, manifest, theme };
export default defaultThemeModule;
