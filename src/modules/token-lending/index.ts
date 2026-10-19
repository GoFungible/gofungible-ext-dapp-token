import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { eventBus } from '../../core/EventBus';
import { TokenLending } from './TokenLending';

import manifestRaw from './manifest.json';
const manifest: ModuleManifest = manifestRaw;

let tokenLendingInstance: ModuleInstance | null = null;

const tokenLendingModule: ModuleInstance = {
  manifest,
  initialize(core) {
    tokenLendingInstance = tokenLendingModule;
    core.registerModule(tokenLendingModule);

    eventBus.on('lending:offer-created', data => {
      console.log('TokenLending: offer created', data);
    });
    eventBus.on('lending:loan-funded', data => {
      console.log('TokenLending: loan funded', data);
    });
    eventBus.on('lending:repayment-recorded', data => {
      console.log('TokenLending: repayment recorded', data);
    });
    eventBus.on('lending:offer-closed', data => {
      console.log('TokenLending: offer closed', data);
    });

    console.log('TokenLending module initialized');
    return Promise.resolve();
  },
  destroy() {
    if (tokenLendingInstance) {
      coreFramework.unregisterModule(tokenLendingModule.manifest.id);
      tokenLendingInstance = null;
    }
    console.log('TokenLending module destroyed');
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

export { tokenLendingModule, manifest, TokenLending };
export default tokenLendingModule;
