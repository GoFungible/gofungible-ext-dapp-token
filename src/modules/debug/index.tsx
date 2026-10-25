import { ModuleInstance, ModuleManifest } from '../../types';
import { coreFramework } from '../../core/CoreFramework';
import { eventBus } from '../../core/EventBus';
import { DebugModule } from './DebugModule';
import { DebugPopup } from './DebugPopup';
import { DebugEvents } from './DebugEvents';
import { createRoot } from 'react-dom/client';

import manifestRaw from './manifest.json';
const manifest: ModuleManifest = manifestRaw;
let debugModuleInstance: ModuleInstance | null = null;

let popupRoot: ReturnType<typeof createRoot> | null = null;
let popupContainer: HTMLElement | null = null;
let isPopupOpen = false;
let listenersRegistered = false;

function renderPopup(open: boolean) {
  isPopupOpen = open;
  if (open) {
    setTimeout(() => {
      if (!isPopupOpen) return;
      if (!popupContainer) {
        popupContainer = document.createElement('div');
        document.body.appendChild(popupContainer);
        popupRoot = createRoot(popupContainer);
      }
      if (popupRoot) {
        const stateRegistry = coreFramework.stateRegistry;
        popupRoot.render(
          <DebugPopup
            isOpen={isPopupOpen}
            stateRegistry={stateRegistry}
            onClose={() => {
              eventBus.emit(DebugEvents.CLOSE, undefined);
              renderPopup(false);
            }}
            onRefresh={() => eventBus.emit(DebugEvents.COLLECT, { correlation: `debug-${Date.now()}` })}
          />
        );
      }
    }, 0);
  }
  if (!open && popupContainer) {
    popupRoot?.unmount();
    popupContainer.remove();
    popupContainer = null;
    popupRoot = null;
  }
}

const debugModule: ModuleInstance = {
  manifest,
  initialize(core) {
    debugModuleInstance = debugModule;
    core.registerModule(debugModule);

    // Register debug module state for inspection
    core.stateRegistry.register(debugModule.manifest.id, () => ({
      registeredModules: coreFramework.getAllModules().map(m => m.manifest.id),
      activeTheme: coreFramework.theme.getActive().id,
    }));

    if (!listenersRegistered) {
      listenersRegistered = true;
      eventBus.on(DebugEvents.COLLECT, (data: unknown) => {
        const { correlation } = data as { correlation: string };
        const snapshot = {
          correlation,
          id: debugModule.manifest.id,
          name: debugModule.manifest.name,
          state: {
            registeredModules: coreFramework.getAllModules().map(m => m.manifest.id),
            activeTheme: coreFramework.theme.getActive().id,
          },
        };
        eventBus.emit(DebugEvents.STATE, snapshot);
      });

      eventBus.on(DebugEvents.TOGGLE, () => {
        renderPopup(!isPopupOpen);
      });

      eventBus.on(DebugEvents.OPEN, () => {
        renderPopup(true);
      });

      eventBus.on(DebugEvents.CLOSE, () => {
        renderPopup(false);
      });
    }

    return Promise.resolve();
  },
  destroy() {
    if (debugModuleInstance) {
      coreFramework.unregisterModule(debugModule.manifest.id);
      debugModuleInstance = null;
    }
    coreFramework.stateRegistry.unregister(debugModule.manifest.id);
    listenersRegistered = false;
    renderPopup(false);
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

export { debugModule, manifest, DebugModule, DebugPopup };
export default debugModule;