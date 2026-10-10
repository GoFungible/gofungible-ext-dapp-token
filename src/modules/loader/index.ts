import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { LoaderModule } from './LoaderModule';

const manifest: ModuleManifest = {
  id: 'loader',
  name: 'Module Loader',
  version: '1.0.0',
  description: 'Load new modules from files, ZIP archives, or URLs',
  author: 'Gofungible Team',
  entryPoint: 'loader',
  routes: [
    {
      path: '/loader',
      component: 'LoaderModule',
      exact: true,
    },
  ],
};

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