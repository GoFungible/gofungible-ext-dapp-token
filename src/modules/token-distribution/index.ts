import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { eventBus } from '../../core/EventBus';
import { TokenDistribution } from './TokenDistribution';

import manifestRaw from './manifest.json';
const manifest: ModuleManifest = manifestRaw;

let tokenDistributionInstance: ModuleInstance | null = null;

const tokenDistributionModule: ModuleInstance = {
  manifest,
  initialize(core) {
    tokenDistributionInstance = tokenDistributionModule;
    core.registerModule(tokenDistributionModule);

    eventBus.on('distribution:airdrop-launched', data => {
      console.log('TokenDistribution: airdrop launched', data);
    });
    eventBus.on('distribution:airdrop-distributed', data => {
      console.log('TokenDistribution: airdrop distributed', data);
    });
    eventBus.on('distribution:airdrop-closed', data => {
      console.log('TokenDistribution: airdrop closed', data);
    });

    console.log('TokenDistribution module initialized');
    return Promise.resolve();
  },
  destroy() {
    if (tokenDistributionInstance) {
      coreFramework.unregisterModule(tokenDistributionModule.manifest.id);
      tokenDistributionInstance = null;
    }
    console.log('TokenDistribution module destroyed');
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

export { tokenDistributionModule, manifest, TokenDistribution };
export default tokenDistributionModule;
