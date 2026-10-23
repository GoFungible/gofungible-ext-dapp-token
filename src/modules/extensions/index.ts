import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { eventBus } from '../../core/EventBus';
import { Extensions } from './Extensions';


import manifestRaw from './manifest.json';
const manifest: ModuleManifest = manifestRaw;
let extensionsInstance: ModuleInstance | null = null;

const extensionsModule: ModuleInstance = {
  manifest,
  initialize(core) {
    extensionsInstance = extensionsModule;
    core.registerModule(extensionsModule);

    eventBus.on('refresh-extensions', () => {
      console.log('Extensions: refresh requested');
    });
    eventBus.on('extensions:bind', (data) => {
      console.log('Extensions: chain bound', data);
    });
    eventBus.on('extensions:unbind', (data) => {
      console.log('Extensions: chain unbound', data);
    });

    console.log('Extensions module initialized');
    return Promise.resolve();
  },
  destroy() {
    if (extensionsInstance) {
      coreFramework.unregisterModule(extensionsModule.manifest.id);
      extensionsInstance = null;
    }
    console.log('Extensions module destroyed');
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

export { extensionsModule, manifest, Extensions };
export default extensionsModule;