import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLayout } from './LayoutProvider';
import { eventBus } from '../core/EventBus';
import { Menu, Settings, Bell, User, ChevronDown, Network, RefreshCw, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { DebugStatePopup } from './DebugStatePopup';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'menu': Menu,
  'settings': Settings,
  'bell': Bell,
  'user': User,
  'chevron-down': ChevronDown,
  'network': Network,
  'refresh-cw': RefreshCw,
  'palette': Palette,
};

export function Topbar() {
  const { sidebarOpen, toggleSidebar, topbarItems } = useLayout();
  const { t, i18n: i18nInstance } = useTranslation();
  const navigate = useNavigate();
  const [debugOpen, setDebugOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface border-b border-border">
        <div className="flex items-center justify-between h-16 px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 text-foreground hover:text-foreground hover:bg-muted/30 rounded-lg"
              aria-label={sidebarOpen ? t('topbar.closeSidebar') : t('topbar.openSidebar')}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-foreground hidden sm:block">
              {t('app.title')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {topbarItems.map(item => {
              const Icon = item.icon ? iconMap[item.icon] : Settings;
              const isDebugButton = item.id === 'token-perimeter-refresh';
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (isDebugButton) {
                      setDebugOpen(true);
                      return;
                    }
                    if (item.route) navigate(item.route);
                    if (item.action) eventBus.emit(item.action, undefined);
                  }}
                  className="p-2 text-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
                  aria-label={t(item.label)}
                  title={t(item.label)}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
            <div className="relative ml-4">
              <select
                value={i18nInstance.language}
                onChange={e => {
                  const code = e.target.value;
                  void i18nInstance.changeLanguage(code);
                  localStorage.setItem('language', code);
                }}
                className="h-11 px-2 text-sm text-foreground border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Language"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative ml-4">
              <select
                className="h-11 px-2 text-sm text-foreground border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Multichain Token"
              >
                <option value="multichain-token">Multichain Token</option>
              </select>
            </div>
            <div className="relative ml-4">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>
      <DebugStatePopup
        isOpen={debugOpen}
        onClose={() => setDebugOpen(false)}
        onRefresh={() => eventBus.emit('refresh-token-perimeter', undefined)}
      />
    </>
  );
}
