import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { Dashboard } from './Dashboard';


import manifestRaw from './manifest.json';
const manifest: ModuleManifest = manifestRaw;
let dashboardInstance: ModuleInstance | null = null;

const dashboardModule: ModuleInstance = {
  manifest,
  initialize(core) {
    dashboardInstance = dashboardModule;
    core.registerModule(dashboardModule);
    console.log('Dashboard module initialized');
    return Promise.resolve();
  },
  destroy() {
    if (dashboardInstance) {
      coreFramework.unregisterModule(dashboardModule.manifest.id);
      dashboardInstance = null;
    }
    console.log('Dashboard module destroyed');
    return Promise.resolve();
  },
  getRoutes() {
    return manifest.routes || [];
  },
  getTopbarItems() {
    return manifest.topbarItems || [];
  },
  getSidebarItems() {
    return manifest.sidebarItems || [];
  },
};

export { dashboardModule, manifest, Dashboard };
export default dashboardModule;