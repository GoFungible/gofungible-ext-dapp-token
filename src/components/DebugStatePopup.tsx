import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XCircle, Copy, CheckCircle, RefreshCw } from 'lucide-react';
import { useChainStore } from '../modules/chains/ChainStore';
import { coreFramework } from '../core/CoreFramework';
import { eventBus } from '../core/EventBus';

interface ModuleSnapshot {
  id: string;
  name: string;
  state: unknown;
}

interface DebugStatePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export function DebugStatePopup({ isOpen, onClose, onRefresh }: DebugStatePopupProps) {
  const { t } = useTranslation();
  const { selectedChainId, selectedChain, chainCache } = useChainStore();
  const [snapshots, setSnapshots] = useState<ModuleSnapshot[]>([]);
  const [copied, setCopied] = useState(false);
  const [collecting, setCollecting] = useState(false);

  const collect = () => {
    setCollecting(true);
    setSnapshots([]);
    const correlation = `debug-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    eventBus.emit('debug:collect', { correlation });
    // Fallback timeout: stop the "collecting" indicator even if no module responds
    window.setTimeout(() => {
      setCollecting(false);
    }, 600);
  };

  useEffect(() => {
    const handler = (data: unknown) => {
      const d = data as { correlation?: string; name?: string; state?: unknown; id?: string };
      if (!d || typeof d !== 'object') return;
      setSnapshots(prev => [
        ...prev,
        { id: d.id || d.name || 'module', name: d.name || d.id || 'module', state: d.state ?? null },
      ]);
    };
    eventBus.on('debug:state', handler);
    return () => eventBus.off('debug:state', handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      collect();
    }
  }, [isOpen]);

  const stateJson = useMemo(() => {
    const modules = coreFramework.getAllModules().map(m => ({
      id: m.manifest.id,
      name: m.manifest.name,
      version: m.manifest.version,
    }));
    const themes = coreFramework.theme.getAll().map(th => ({
      id: th.id,
      name: th.name,
      mode: th.mode,
      active: th.id === coreFramework.theme.getActive().id,
    }));
    const activeTheme = coreFramework.theme.getActive();
    const chains = Object.values(chainCache);
    return {
      capturedAt: new Date().toISOString(),
      chainStore: {
        selectedChainId,
        selectedChain: selectedChain ?? null,
        chainCount: Object.keys(chainCache).length,
      },
      chains,
      themes,
      activeTheme: { id: activeTheme.id, name: activeTheme.name, mode: activeTheme.mode },
      modules,
      moduleSnapshots: snapshots,
    };
  }, [selectedChainId, selectedChain, chainCache, snapshots]);

  if (!isOpen) return null;

  const pretty = JSON.stringify(stateJson, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pretty);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-xl border border-border shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
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
              onClick={() => { void handleCopy(); }}
              className="p-2 text-muted hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
              aria-label={t('debugState.copy')}
              title={t('debugState.copy')}
            >
              {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
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