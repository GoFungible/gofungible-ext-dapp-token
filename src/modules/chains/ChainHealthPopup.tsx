import { useTranslation } from 'react-i18next';
import { XCircle, Wifi, WifiOff, AlertTriangle, Loader2, HelpCircle, ExternalLink } from 'lucide-react';
import type { ChainHealth } from './chainHealth';
import { useChainStore } from './ChainStore';

interface ChainHealthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  health: ChainHealth | null;
  isChecking: boolean;
  check: () => void;
}

export function ChainHealthPopup({ isOpen, onClose, health, isChecking, check }: ChainHealthPopupProps) {
  const { t } = useTranslation();
  const { selectedChain } = useChainStore();

  if (!isOpen) return null;

  const getStatusInfo = () => {
    if (!health) {
      return {
        icon: HelpCircle,
        color: 'text-muted',
        bgColor: 'bg-gray-50',
        title: t('chains.nodeUnknown'),
        message: t('chains.nodeUnknown'),
      };
    }
    if (isChecking) {
      return {
        icon: Loader2,
        color: 'text-muted',
        bgColor: 'bg-gray-50',
        title: t('chains.checkingNode'),
        message: t('chains.checkingNode'),
      };
    }
    if (health.status === 'online') {
      return {
        icon: Wifi,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        title: t('chains.nodeOnline'),
        message: t('chains.nodeOnline'),
      };
    }
    if (health.status === 'offline') {
      return {
        icon: WifiOff,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        title: t('chains.nodeOfflineBadge'),
        message: health.failure?.message || t('environment.nodeOffline', { name: selectedChain?.name || '', url: selectedChain?.rpcUrl || '' }),
      };
    }
    if (health.status === 'mismatch') {
      return {
        icon: AlertTriangle,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        title: t('chains.nodeMismatchBadge'),
        message: t('environment.nodeMismatch', {
          name: selectedChain?.name || '',
          url: selectedChain?.rpcUrl || '',
          expected: health.expectedChainId ?? '',
          actual: health.chainId ?? '',
        }),
      };
    }
    return {
      icon: HelpCircle,
      color: 'text-muted',
      bgColor: 'bg-gray-50',
      title: t('chains.nodeUnknown'),
      message: t('chains.nodeUnknown'),
    };
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-surface rounded-xl border border-border shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${status.color}`} />
            <h2 className="text-lg font-semibold text-foreground">{status.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
            aria-label={t('common.close')}
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div className={`rounded-lg p-4 ${status.bgColor} ${status.color}`}>
            <p className="text-sm">{status.message}</p>
          </div>

          {selectedChain && health && health.status !== 'online' && (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">{t('chains.chainDetails')}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted">{t('chains.chainName')}: </span>
                  <span className="font-mono">{selectedChain.name}</span>
                </div>
                <div>
                  <span className="text-muted">{t('chains.chainId')}: </span>
                  <span className="font-mono">{selectedChain.id}</span>
                </div>
                <div>
                  <span className="text-muted">{t('chains.rpcUrl')}: </span>
                  <span className="font-mono truncate block">{selectedChain.rpcUrl}</span>
                </div>
                {health.chainId && (
                  <div>
                    <span className="text-muted">{t('chains.actualChainId')}: </span>
                    <span className="font-mono">{health.chainId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {health?.failure && (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">{t('chains.errorDetails')}</p>
              <div className="rounded-lg p-3 bg-red-50 text-red-800 text-xs font-mono break-words">
                {health.failure.message}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => { check(); onClose(); }}
              disabled={isChecking}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('chains.checkingNode')}
                </>
              ) : (
                <>
                  <Loader2 className="h-4 w-4" />
                  {t('chains.retryNodeCheck')}
                </>
              )}
            </button>
            {selectedChain?.blockExplorer && (
              <a
                href={selectedChain.blockExplorer}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {t('chains.openExplorer')}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}