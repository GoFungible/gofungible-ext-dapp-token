import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { ThemeManager } from './ThemeManager';

const manifest: ModuleManifest = {
  id: 'theme-manager',
  name: 'Theme Manager',
  version: '1.0.0',
  description: 'Manage and switch application themes',
  author: 'Gofungible Team',
  entryPoint: 'theme-manager',
  routes: [
    {
      path: '/themes',
      component: 'ThemeManager',
      exact: true,
    },
  ],
  topbarItems: [
    {
      id: 'theme-manager',
      label: 'themeManager.navLabel',
      icon: 'palette',
      route: '/themes',
      order: 10,
    },
  ],
};

let instance: ModuleInstance | null = null;

const themeManagerModule: ModuleInstance = {
  manifest,
  initialize(core) {
    instance = themeManagerModule;
    core.registerModule(themeManagerModule);
    return Promise.resolve();
  },
  destroy() {
    if (instance) {
      coreFramework.unregisterModule(themeManagerModule.manifest.id);
      instance = null;
    }
    return Promise.resolve();
  },
  getRoutes() { return manifest.routes || []; },
  getTopbarItems() { return manifest.topbarItems || []; },
  getSidebarItems() { return []; },
};

export { themeManagerModule, manifest, ThemeManager };
export default themeManagerModule;
