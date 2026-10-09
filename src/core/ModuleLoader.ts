import { ModuleInstance, ModuleManifest } from '../types';
import { coreFramework } from './CoreFramework';
import JSZip from 'jszip';

class ModuleLoader {
  async loadFromFile(file: File): Promise<ModuleInstance> {
    const text = await file.text();
    const moduleExports = await this.evaluateModule(text);
    const manifest = this.extractManifest(moduleExports, file.name);
    return coreFramework.initializeModule(manifest, moduleExports);
  }

  async loadFromZip(zipFile: File): Promise<ModuleInstance[]> {
    const zip = await JSZip.loadAsync(zipFile);
    const modules: ModuleInstance[] = [];

    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if (!zipEntry.dir && filename.endsWith('.js')) {
        try {
          const text = await zipEntry.async('text');
          const moduleExports = await this.evaluateModule(text);
          const manifest = this.extractManifest(moduleExports, filename);
          const module = await coreFramework.initializeModule(manifest, moduleExports);
          modules.push(module);
        } catch (error) {
          console.error(`Failed to load module from ${filename}:`, error);
        }
      }
    }

    return modules;
  }

  async loadFromUrl(url: string): Promise<ModuleInstance> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch module from ${url}: ${response.statusText}`);
    }
    const text = await response.text();
    const moduleExports = await this.evaluateModule(text);
    const manifest = this.extractManifest(moduleExports, url);
    return coreFramework.initializeModule(manifest, moduleExports);
  }

  private async evaluateModule(code: string): Promise<unknown> {
    const moduleExports = {};
    const mod = { exports: moduleExports };
    
    await new Promise<void>((resolve, reject) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const func = new Function('module', 'exports', 'require', code);
        func(mod, moduleExports, (name: string) => {
          if (name === 'react') return import('react');
          if (name === 'react-dom') return import('react-dom');
          if (name === 'react-router-dom') return import('react-router-dom');
          if (name === 'lucide-react') return import('lucide-react');
          throw new Error(`Module ${name} not allowed`);
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return mod.exports;
  }

  private extractManifest(moduleExports: unknown, source: string): ModuleManifest {
    const exports = moduleExports as Record<string, unknown>;
    
    if (exports.manifest && typeof exports.manifest === 'object') {
      return exports.manifest as ModuleManifest;
    }

    return {
      id: `module-${Date.now()}`,
      name: 'Unnamed Module',
      version: '1.0.0',
      description: `Module loaded from ${source}`,
      author: 'Unknown',
      entryPoint: source,
    };
  }
}

export const moduleLoader = new ModuleLoader();