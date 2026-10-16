import { ModuleInstance, ModuleManifest, ThemeConfig } from '../../../types';
import { coreFramework } from '../../../core/CoreFramework';

const theme: ThemeConfig = {
  id: 'brand',
  name: 'Brand',
  description: 'Brand identity theme with purple accent',
  colors: {
    primary: '#7c3aed',
    secondary: '#ec4899',
    background: '#faf5ff',
    surface: '#ffffff',
    text: '#1f1a2e',
    accent: '#10b981',
    border: '#e9d5ff',
    muted: '#6b7280',
  },
  fonts: {
    sans: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, monospace',
    heading: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
  },
  radius: '0.75rem',
  mode: 'light',
};

const manifest: ModuleManifest = {
  id: 'brand-theme',
  name: 'Brand Theme',
  version: '1.0.0',
  description: 'Brand identity theme with purple accent',
  author: 'Gofungible Team',
  entryPoint: 'brand-theme',
  extensionPoints: ['theme'],
  theme,
};

let instance: ModuleInstance | null = null;

const brandThemeModule: ModuleInstance = {
  manifest,
  initialize(core) {
    instance = brandThemeModule;
    core.registerModule(brandThemeModule);
    if (manifest.theme) core.theme.register(manifest.theme);
    return Promise.resolve();
  },
  destroy() {
    if (instance) {
      coreFramework.unregisterModule(brandThemeModule.manifest.id);
      coreFramework.theme.unregister('brand');
      instance = null;
    }
    return Promise.resolve();
  },
  getRoutes() { return []; },
  getTopbarItems() { return []; },
  getSidebarItems() { return []; },
};

export { brandThemeModule, manifest, theme };
export default brandThemeModule;
