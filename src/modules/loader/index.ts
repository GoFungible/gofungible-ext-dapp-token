import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { LoaderModule } from './LoaderModule';


import manifestRaw from './manifest.json';
const manifest: ModuleManifest = manifestRaw;
let loaderModuleInstance: ModuleInstance | null = null;

const loaderModule: ModuleInstance = {
  manifest,
  initialize(core) {
    loaderModuleInstance = loaderModule;
    core.registerModule(loaderModule);
    console.log('Loader module initialized');
    return Promise.resolve();
  },
  destroy() {
    if (loaderModuleInstance) {
      coreFramework.unregisterModule(loaderModule.manifest.id);
      loaderModuleInstance = null;
    }
    console.log('Loader module destroyed');
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

export { loaderModule, manifest, LoaderModule };
export default loaderModule;