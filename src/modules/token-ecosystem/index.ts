import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { eventBus } from '../../core/EventBus';
import { TokenEcosystem } from './TokenEcosystem';


import manifestRaw from './manifest.json';
const manifest: ModuleManifest = manifestRaw;
let tokenEcosystemInstance: ModuleInstance | null = null;

const tokenEcosystemModule: ModuleInstance = {
  manifest,
  initialize(core) {
    tokenEcosystemInstance = tokenEcosystemModule;
    core.registerModule(tokenEcosystemModule);

    eventBus.on('refresh-token-ecosystem', () => {
      console.log('TokenEcosystem: refresh requested');
    });
    eventBus.on('ecosystem:bind', (data) => {
      console.log('TokenEcosystem: chain bound', data);
    });
    eventBus.on('ecosystem:unbind', (data) => {
      console.log('TokenEcosystem: chain unbound', data);
    });

    console.log('TokenEcosystem module initialized');
    return Promise.resolve();
  },
  destroy() {
    if (tokenEcosystemInstance) {
      coreFramework.unregisterModule(tokenEcosystemModule.manifest.id);
      tokenEcosystemInstance = null;
    }
    console.log('TokenEcosystem module destroyed');
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

export { tokenEcosystemModule, manifest, TokenEcosystem };
export default tokenEcosystemModule;