import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { TokenBridge } from './TokenBridge';

const manifest: ModuleManifest = {
  id: 'token-bridge',
  name: 'Token Bridge',
  version: '1.0.0',
  description: 'Bridge token units between chains in the multichain token perimeter',
  author: 'Gofungible Team',
  entryPoint: 'token-bridge',
  routes: [
    {
      path: '/bridge',
      component: 'TokenBridge',
      exact: true,
    },
  ],
  sidebarItems: [
    {
      id: 'token-bridge',
      label: 'Token Bridge',
      icon: 'arrow-right-left',
      route: '/bridge',
      order: 2,
    },
  ],
};

let tokenBridgeInstance: ModuleInstance | null = null;

const tokenBridgeModule: ModuleInstance = {
  manifest,
  initialize(core) {
    tokenBridgeInstance = tokenBridgeModule;
    core.registerModule(tokenBridgeModule);
    console.log('TokenBridge module initialized');
    return Promise.resolve();
  },
  destroy() {
    if (tokenBridgeInstance) {
      coreFramework.unregisterModule(tokenBridgeModule.manifest.id);
      tokenBridgeInstance = null;
    }
    console.log('TokenBridge module destroyed');
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

export { tokenBridgeModule, manifest, TokenBridge };
export default tokenBridgeModule;