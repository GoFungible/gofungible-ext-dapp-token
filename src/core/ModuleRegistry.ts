import { ModuleInstance, ModuleManifest } from '../types';
import { eventBus } from './EventBus';

class ModuleRegistry {
  private modules: Map<string, ModuleInstance> = new Map();

  register(module: ModuleInstance): void {
    if (this.modules.has(module.manifest.id)) {
      console.warn(`Module ${module.manifest.id} already registered, replacing...`);
    }
    this.modules.set(module.manifest.id, module);
    eventBus.emit('module:registered', module.manifest);
  }

  unregister(moduleId: string): void {
    const module = this.modules.get(moduleId);
    if (module) {
      module.destroy().catch(console.error);
      this.modules.delete(moduleId);
      eventBus.emit('module:unregistered', moduleId);
    }
  }

  get(moduleId: string): ModuleInstance | undefined {
    return this.modules.get(moduleId);
  }

  getAll(): ModuleInstance[] {
    return Array.from(this.modules.values());
  }

  getAllManifests(): ModuleManifest[] {
    return Array.from(this.modules.values()).map(m => m.manifest);
  }

  has(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }
}

export const moduleRegistry = new ModuleRegistry();