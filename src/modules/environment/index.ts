import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { eventBus } from '../../core/EventBus';
import { Environment } from './Environment';


import manifestRaw from './manifest.json';
const manifest: ModuleManifest = manifestRaw;
let environmentInstance: ModuleInstance | null = null;

const environmentModule: ModuleInstance = {
  manifest,
  initialize(core) {
    environmentInstance = environmentModule;
    core.registerModule(environmentModule);

    eventBus.on('environment:token-deployed', (data) => {
      console.log('Environment: token deployed', data);
    });
    eventBus.on('environment:proxy-deployed', (data) => {
      console.log('Environment: proxy deployed', data);
    });
    eventBus.on('environment:factory-deployed', (data) => {
      console.log('Environment: factory deployed', data);
    });
    eventBus.on('refresh-environment', () => {
      console.log('Environment: refresh requested');
    });

    console.log('Environment module initialized');
    return Promise.resolve();
  },
  destroy() {
    if (environmentInstance) {
      coreFramework.unregisterModule(environmentModule.manifest.id);
      environmentInstance = null;
    }
    console.log('Environment module destroyed');
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

export { environmentModule, manifest, Environment };
export default environmentModule;
