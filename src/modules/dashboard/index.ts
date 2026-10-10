import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { Dashboard } from './Dashboard';

const manifest: ModuleManifest = {
  id: 'dashboard',
  name: 'Dashboard',
  version: '1.0.0',
  description: 'Overview of all chains where the multichain token is present and ERC-20 features',
  author: 'Gofungible Team',
  entryPoint: 'dashboard',
  routes: [
    {
      path: '/',
      component: 'Dashboard',
      exact: true,
    },
  ],
  sidebarItems: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'layout-dashboard',
      route: '/',
      order: 0,
    },
  ],
};

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