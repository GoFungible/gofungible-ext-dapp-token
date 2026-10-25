import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XCircle, Copy, RefreshCw, RotateCcw } from 'lucide-react';
import { coreFramework } from '../../core/CoreFramework';
import { eventBus } from '../../core/EventBus';
import { DebugEvents } from './DebugEvents';
import { StateRegistry } from '../../types';

interface ModuleSnapshot {
  id: string;
  name: string;
  state: unknown;
}

interface DebugPopupProps {
  isOpen: boolean;
  stateRegistry: StateRegistry;
  onClose: () => void;
  onRefresh?: () => void;
}

export function DebugPopup({ isOpen, stateRegistry, onClose, onRefresh }: DebugPopupProps) {
  const { t } = useTranslation();
  const [snapshots, setSnapshots] = useState<ModuleSnapshot[]>([]);
  const [collecting, setCollecting] = useState(false);

  const collect = useCallback(() => {
    setCollecting(true);
    setSnapshots([]);
    const correlation = `debug-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    eventBus.emit(DebugEvents.COLLECT, { correlation });
    window.setTimeout(() => {
      setCollecting(false);
    }, 600);
  }, []);

  useEffect(() => {
    const handler = (data: unknown) => {
      const d = data as { correlation?: string; name?: string; state?: unknown; id?: string };
      if (!d || typeof d !== 'object') return;
      setSnapshots(prev => [
        ...prev,
        { id: d.id || d.name || 'module', name: d.name || d.id || 'module', state: d.state ?? null },
      ]);
    };
    eventBus.on(DebugEvents.STATE, handler);
    return () => eventBus.off(DebugEvents.STATE, handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      collect();
    }
  }, [isOpen, collect]);

  const allState = useMemo(() => stateRegistry.getAllState(), [stateRegistry]);

  const stateJson = useMemo(() => {
    const modules = coreFramework.getAllModules().map(m => ({
      id: m.manifest.id,
      name: m.manifest.name,
      version: m.manifest.version,
    }));
    const themes = coreFramework.theme.getAll();
    const activeTheme = coreFramework.theme.getActive();
    return {
      capturedAt: new Date().toISOString(),
      allModuleState: allState,
      themes,
      activeTheme: activeTheme ? { id: activeTheme.id, name: activeTheme.name, mode: activeTheme.mode } : null,
      modules,
      moduleSnapshots: snapshots,
    };
  }, [allState, snapshots]);

  if (!isOpen) return null;

  const pretty = JSON.stringify(stateJson, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pretty);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      style={{ pointerEvents: 'auto' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-surface rounded-xl border border-border shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">{t('debugState.title')}</h2>
            {collecting && (
              <span className="text-xs text-muted">{t('debugState.collecting')}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { collect(); onRefresh?.(); }}
              className="p-2 text-muted hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
              aria-label={t('common.refresh')}
              title={t('common.refresh')}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => { 
                localStorage.removeItem('chain-cache-v1'); 
                collect(); 
              }}
              className="p-2 text-muted hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
              aria-label={t('debugState.resetCache')}
              title={t('debugState.resetCache')}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={handleCopy}
              className="p-2 text-muted hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
              aria-label={t('debugState.copy')}
              title={t('debugState.copy')}
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-muted hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
              aria-label={t('common.close')}
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
        <pre className="flex-1 overflow-auto p-4 bg-gray-900 text-gray-100 text-xs font-mono rounded-b-xl m-0">
          {pretty}
        </pre>
      </div>
    </div>
  );
}