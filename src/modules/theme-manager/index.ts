import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { ThemeManager } from './ThemeManager';


import manifestRaw from './manifest.json';
const manifest: ModuleManifest = manifestRaw as ModuleManifest;
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
