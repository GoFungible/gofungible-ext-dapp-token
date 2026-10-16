import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { eventBus } from '../../core/EventBus';
import { TokenNegotiation } from './TokenNegotiation';


import manifestRaw from './manifest.json';
const manifest: ModuleManifest = manifestRaw;
let tokenNegotiationInstance: ModuleInstance | null = null;

const tokenNegotiationModule: ModuleInstance = {
  manifest,
  initialize(core) {
    tokenNegotiationInstance = tokenNegotiationModule;
    core.registerModule(tokenNegotiationModule);

    eventBus.on('token-negotiation:set-units', (data) => {
      console.log('TokenNegotiation: units set', data);
    });
    eventBus.on('refresh-token-negotiation', () => {
      console.log('TokenNegotiation: refresh requested');
    });

    console.log('TokenNegotiation module initialized');
    return Promise.resolve();
  },
  destroy() {
    if (tokenNegotiationInstance) {
      coreFramework.unregisterModule(tokenNegotiationModule.manifest.id);
      tokenNegotiationInstance = null;
    }
    console.log('TokenNegotiation module destroyed');
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

export { tokenNegotiationModule, manifest, TokenNegotiation };
export default tokenNegotiationModule;
