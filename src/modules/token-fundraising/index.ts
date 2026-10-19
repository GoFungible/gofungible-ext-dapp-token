import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { eventBus } from '../../core/EventBus';
import { TokenFundraising } from './TokenFundraising';

import manifestRaw from './manifest.json';
const manifest: ModuleManifest = manifestRaw;

let tokenFundraisingInstance: ModuleInstance | null = null;

const tokenFundraisingModule: ModuleInstance = {
  manifest,
  initialize(core) {
    tokenFundraisingInstance = tokenFundraisingModule;
    core.registerModule(tokenFundraisingModule);

    eventBus.on('fundraising:ico-launched', data => {
      console.log('TokenFundraising: ICO launched', data);
    });
    eventBus.on('fundraising:ico-closed', data => {
      console.log('TokenFundraising: ICO closed', data);
    });
    eventBus.on('fundraising:contribution', data => {
      console.log('TokenFundraising: contribution recorded', data);
    });

    console.log('TokenFundraising module initialized');
    return Promise.resolve();
  },
  destroy() {
    if (tokenFundraisingInstance) {
      coreFramework.unregisterModule(tokenFundraisingModule.manifest.id);
      tokenFundraisingInstance = null;
    }
    console.log('TokenFundraising module destroyed');
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

export { tokenFundraisingModule, manifest, TokenFundraising };
export default tokenFundraisingModule;
