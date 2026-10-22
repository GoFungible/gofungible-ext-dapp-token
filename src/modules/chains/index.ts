import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { eventBus } from '../../core/EventBus';
import { probeChain, type ChainHealth, type ChainHealthStatus } from './chainHealth';
import { classifyRpcFailure, isChainUnreachable, type RpcFailure, type RpcFailureKind } from './rpcErrors';


import manifestRaw from './manifest.json';
const manifest: ModuleManifest = manifestRaw;
let chainsInstance: ModuleInstance | null = null;

const chainsModule: ModuleInstance = {
  manifest,
  initialize(core) {
    chainsInstance = chainsModule;
    core.registerModule(chainsModule);

    eventBus.on('chain:unreachable', (data) => {
      console.warn('Chains: chain unreachable', data);
    });

    console.log('Chains module initialized');
    return Promise.resolve();
  },
  destroy() {
    if (chainsInstance) {
      coreFramework.unregisterModule(chainsModule.manifest.id);
      chainsInstance = null;
    }
    console.log('Chains module destroyed');
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

export { chainsModule, manifest, probeChain, classifyRpcFailure, isChainUnreachable };
export type { ChainHealth, ChainHealthStatus, RpcFailure, RpcFailureKind };
export default chainsModule;
