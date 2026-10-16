import { ModuleInstance, ModuleManifest, ThemeConfig } from '../../../types';
import { coreFramework } from '../../../core/CoreFramework';
import './retro.css';

const theme: ThemeConfig = {
  id: 'retro',
  name: 'Retro 80s',
  description: 'Neon retro aesthetic with monospace font',
  colors: { primary: '#ff00ff', secondary: '#00ffff', background: '#1a0033', surface: '#2d0a4e', text: '#ffff00', accent: '#39ff14', border: '#ff00ff', muted: '#ff99ff' },
  fonts: { sans: "'Courier New', monospace", mono: "'Courier New', monospace", heading: "'Courier New', monospace" },
  radius: '0px',
  mode: 'dark',
};

const manifest: ModuleManifest = { id: 'retro-theme', name: 'Retro 80s Theme', version: '1.0.0', description: 'Neon retro theme with CSS refinements', author: 'Gofungible Team', entryPoint: 'retro-theme', extensionPoints: ['theme'], theme };

let instance: ModuleInstance | null = null;
const retroThemeModule: ModuleInstance = {
  manifest,
  initialize(core) { instance = retroThemeModule; core.registerModule(retroThemeModule); if (manifest.theme) core.theme.register(manifest.theme); return Promise.resolve(); },
  destroy() { if (instance) { coreFramework.unregisterModule(retroThemeModule.manifest.id); coreFramework.theme.unregister('retro'); instance = null; } return Promise.resolve(); },
  getRoutes() { return []; }, getTopbarItems() { return []; }, getSidebarItems() { return []; },
};

export { retroThemeModule, manifest, theme };
export default retroThemeModule;
