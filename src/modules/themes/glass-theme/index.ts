import { ModuleInstance, ModuleManifest, ThemeConfig } from '../../../types';
import { coreFramework } from '../../../core/CoreFramework';
import './glass.css';

const theme: ThemeConfig = {
  id: 'glass',
  name: 'Glass Morphism',
  description: 'Translucent glass with backdrop blur',
  colors: { primary: '#06b6d4', secondary: '#8b5cf6', background: '#e0f2fe', surface: 'rgba(255,255,255,0.6)', text: '#0f172a', accent: '#ec4899', border: 'rgba(15,23,42,0.08)', muted: '#475569' },
  fonts: { sans: 'Inter, sans-serif', mono: "'JetBrains Mono', monospace", heading: 'Inter, sans-serif' },
  radius: '1rem',
  mode: 'light',
};

const manifest: ModuleManifest = { id: 'glass-theme', name: 'Glass Theme', version: '1.0.0', description: 'Glass morphism theme with CSS refinements', author: 'Gofungible Team', entryPoint: 'glass-theme', extensionPoints: ['theme'], theme };

let instance: ModuleInstance | null = null;
const glassThemeModule: ModuleInstance = {
  manifest,
  initialize(core) { instance = glassThemeModule; core.registerModule(glassThemeModule); if (manifest.theme) core.theme.register(manifest.theme); return Promise.resolve(); },
  destroy() { if (instance) { coreFramework.unregisterModule(glassThemeModule.manifest.id); coreFramework.theme.unregister('glass'); instance = null; } return Promise.resolve(); },
  getRoutes() { return []; }, getTopbarItems() { return []; }, getSidebarItems() { return []; },
};

export { glassThemeModule, manifest, theme };
export default glassThemeModule;
