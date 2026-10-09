import { CoreFramework, ModuleInstance, ModuleManifest, ModuleRoute, TopbarItem, SidebarItem } from '../types';
import { moduleRegistry } from './ModuleRegistry';
import { eventBus } from './EventBus';
import { layoutManager } from './LayoutManager';

class CoreFrameworkImpl implements CoreFramework {
  eventBus = eventBus;
  layout = layoutManager;

  registerModule(module: ModuleInstance): void {
    moduleRegistry.register(module);
  }

  unregisterModule(moduleId: string): void {
    moduleRegistry.unregister(moduleId);
  }

  getModule(moduleId: string): ModuleInstance | undefined {
    return moduleRegistry.get(moduleId);
  }

  getAllModules(): ModuleInstance[] {
    return moduleRegistry.getAll();
  }

  getAllRoutes(): ModuleRoute[] {
    return moduleRegistry.getAll().flatMap(m => m.getRoutes());
  }

  getAllTopbarItems(): TopbarItem[] {
    return moduleRegistry.getAll()
      .flatMap(m => m.getTopbarItems())
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  getAllSidebarItems(): SidebarItem[] {
    return moduleRegistry.getAll()
      .flatMap(m => m.getSidebarItems())
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async initializeModule(_manifest: ModuleManifest, moduleExports: unknown): Promise<ModuleInstance> {
    const module = moduleExports as ModuleInstance;
    if (typeof module.initialize === 'function') {
      await module.initialize(this);
    }
    this.registerModule(module);
    return module;
  }
}

export const coreFramework = new CoreFrameworkImpl();