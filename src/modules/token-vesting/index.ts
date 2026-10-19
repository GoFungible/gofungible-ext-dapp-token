import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { eventBus } from '../../core/EventBus';
import { TokenVesting } from './TokenVesting';

import manifestRaw from './manifest.json';
const manifest: ModuleManifest = manifestRaw;

let tokenVestingInstance: ModuleInstance | null = null;

const tokenVestingModule: ModuleInstance = {
  manifest,
  initialize(core) {
    tokenVestingInstance = tokenVestingModule;
    core.registerModule(tokenVestingModule);

    eventBus.on('vesting:schedule-created', data => {
      console.log('TokenVesting: schedule created', data);
    });
    eventBus.on('vesting:tokens-released', data => {
      console.log('TokenVesting: tokens released', data);
    });
    eventBus.on('vesting:schedule-cancelled', data => {
      console.log('TokenVesting: schedule cancelled', data);
    });

    console.log('TokenVesting module initialized');
    return Promise.resolve();
  },
  destroy() {
    if (tokenVestingInstance) {
      coreFramework.unregisterModule(tokenVestingModule.manifest.id);
      tokenVestingInstance = null;
    }
    console.log('TokenVesting module destroyed');
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

export { tokenVestingModule, manifest, TokenVesting };
export default tokenVestingModule;
