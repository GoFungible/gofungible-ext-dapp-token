import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, RefreshCw } from 'lucide-react';
import { useCoreFramework } from '../../core/CoreFrameworkContext';
import { coreFramework } from '../../core/CoreFramework';
import { useDebug } from './useDebug';

export function DebugModule() {
  const { t } = useTranslation();
  const { stateRegistry } = useCoreFramework();
  const { snapshots, collecting, collect } = useDebug();

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

  const pretty = JSON.stringify(stateJson, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pretty);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">{t('debugState.title')}</h2>
          {collecting && (
            <span className="text-xs text-muted">{t('debugState.collecting')}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={collect}
            className="p-2 text-muted hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
            aria-label={t('common.refresh')}
            title={t('common.refresh')}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 text-muted hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
            aria-label={t('debugState.copy')}
            title={t('debugState.copy')}
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>
      <pre className="flex-1 overflow-auto p-4 bg-gray-900 text-gray-100 text-xs font-mono rounded-b-xl m-0">
        {pretty}
      </pre>
    </div>
  );
}