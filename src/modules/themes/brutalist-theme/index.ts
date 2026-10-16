import { ModuleInstance, ModuleManifest, ThemeConfig } from '../../../types';
import { coreFramework } from '../../../core/CoreFramework';
import './brutalist.css';

const theme: ThemeConfig = {
  id: 'brutalist',
  name: 'Neo-Brutalist',
  description: 'Hard shadows and thick borders',
  colors: { primary: '#000000', secondary: '#ffe600', background: '#ffe600', surface: '#ffffff', text: '#000000', accent: '#ff0000', border: '#000000', muted: '#333333' },
  fonts: { sans: "'Helvetica Neue','Arial Black',sans-serif", mono: "'Courier New',monospace", heading: "'Arial Black','Helvetica Neue',sans-serif" },
  radius: '0px',
  mode: 'light',
};


import manifestRaw from './manifest.json';
const manifest: ModuleManifest = manifestRaw as ModuleManifest;
let instance: ModuleInstance | null = null;
const brutalistThemeModule: ModuleInstance = {
  manifest,
  initialize(core) { instance = brutalistThemeModule; core.registerModule(brutalistThemeModule); if (manifest.theme) core.theme.register(manifest.theme); return Promise.resolve(); },
  destroy() { if (instance) { coreFramework.unregisterModule(brutalistThemeModule.manifest.id); coreFramework.theme.unregister('brutalist'); instance = null; } return Promise.resolve(); },
  getRoutes() { return []; }, getTopbarItems() { return []; }, getSidebarItems() { return []; },
};

export { brutalistThemeModule, manifest, theme };
export default brutalistThemeModule;
