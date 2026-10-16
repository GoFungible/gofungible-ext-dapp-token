import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { TokenBridge } from './TokenBridge';


import manifestRaw from './manifest.json';
const manifest: ModuleManifest = manifestRaw as ModuleManifest;
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