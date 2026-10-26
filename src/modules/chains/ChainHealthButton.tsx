import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChainHealth } from './hooks/useChainHealth';
import { ChainHealthPopup } from './ChainHealthPopup';
import { Wifi, WifiOff, AlertTriangle, Loader2, HelpCircle } from 'lucide-react';

export function ChainHealthButton() {
  const { t } = useTranslation();
  const { health, isChecking, check } = useChainHealth();
  const [popupOpen, setPopupOpen] = useState(false);

  const getButtonIcon = () => {
    if (!health) return HelpCircle;
    if (isChecking) return Loader2;
    if (health.status === 'online') return Wifi;
    if (health.status === 'offline') return WifiOff;
    if (health.status === 'mismatch') return AlertTriangle;
    return HelpCircle;
  };

  const getButtonColor = () => {
    if (!health) return 'text-muted';
    if (isChecking) return 'text-muted';
    if (health.status === 'online') return 'text-green-600';
    if (health.status === 'offline') return 'text-red-600';
    if (health.status === 'mismatch') return 'text-amber-600';
    return 'text-muted';
  };

  const getTooltip = () => {
    if (!health) return t('chains.nodeUnknown');
    if (isChecking) return t('chains.checkingNode');
    if (health.status === 'online') return t('chains.nodeOnline');
    if (health.status === 'offline') return t('chains.nodeOfflineBadge');
    if (health.status === 'mismatch') return t('chains.nodeMismatchBadge');
    return t('chains.nodeUnknown');
  };

  const Icon = getButtonIcon();
  const color = getButtonColor();

  return (
    <>
      <button
        onClick={() => setPopupOpen(true)}
        className={`p-2 ${color} hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors flex-shrink-0`}
        aria-label={getTooltip()}
        title={getTooltip()}
      >
        {Icon === Loader2 && isChecking ? (
          <Icon className="h-5 w-5 animate-spin" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </button>
      <ChainHealthPopup
        isOpen={popupOpen}
        onClose={() => setPopupOpen(false)}
        health={health}
        isChecking={isChecking}
        check={check}
      />
    </>
  );
}