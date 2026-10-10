import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { eventBus } from '../../core/EventBus';
import { TokenPerimeter } from './TokenPerimeter';

const manifest: ModuleManifest = {
  id: 'token-perimeter',
  name: 'Token Perimeter',
  version: '1.0.0',
  description: 'Manage the EVM chains covered by the multichain token perimeter',
  author: 'Gofungible Team',
  entryPoint: 'token-perimeter',
  routes: [
    {
      path: '/perimeter',
      component: 'TokenPerimeter',
      exact: true,
    },
  ],
  topbarItems: [
    {
      id: 'token-perimeter-refresh',
      label: 'Refresh',
      icon: 'refresh-cw',
      action: 'refresh-token-perimeter',
      order: 1,
    },
  ],
  sidebarItems: [
    {
      id: 'token-perimeter',
      label: 'Token Perimeter',
      icon: 'network',
      route: '/perimeter',
      order: 1,
    },
  ],
};

let tokenPerimeterInstance: ModuleInstance | null = null;

const tokenPerimeterModule: ModuleInstance = {
  manifest,
  initialize(core) {
    tokenPerimeterInstance = tokenPerimeterModule;
    core.registerModule(tokenPerimeterModule);

    eventBus.on('refresh-token-perimeter', () => {
      console.log('TokenPerimeter: refresh requested');
    });
    eventBus.on('perimeter:bind', (data) => {
      console.log('TokenPerimeter: chain bound', data);
    });
    eventBus.on('perimeter:unbind', (data) => {
      console.log('TokenPerimeter: chain unbound', data);
    });

    console.log('TokenPerimeter module initialized');
    return Promise.resolve();
  },
  destroy() {
    if (tokenPerimeterInstance) {
      coreFramework.unregisterModule(tokenPerimeterModule.manifest.id);
      tokenPerimeterInstance = null;
    }
    console.log('TokenPerimeter module destroyed');
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

export { tokenPerimeterModule, manifest, TokenPerimeter };
export default tokenPerimeterModule;
