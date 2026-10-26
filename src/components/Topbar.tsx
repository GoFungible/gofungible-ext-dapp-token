import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLayout } from './LayoutProvider';
import { eventBus } from '../core/EventBus';
import { Menu, Settings, Bell, User, ChevronDown, Network, RefreshCw, Palette, Bug } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'menu': Menu,
  'settings': Settings,
  'bell': Bell,
  'user': User,
  'chevron-down': ChevronDown,
  'network': Network,
  'refresh-cw': RefreshCw,
  'palette': Palette,
  'bug': Bug,
};

export function Topbar() {
  const { sidebarOpen, toggleSidebar, topbarItems } = useLayout();
  const { t, i18n: i18nInstance } = useTranslation();
  const navigate = useNavigate();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface border-b border-border">
        <div className="flex items-center justify-between h-16 px-4 lg:px-8">
          <div className="flex items-center gap-4 overflow-x-auto lg:overflow-visible">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 text-foreground hover:text-foreground hover:bg-muted/30 rounded-lg flex-shrink-0"
              aria-label={sidebarOpen ? t('topbar.closeSidebar') : t('topbar.openSidebar')}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2 lg:gap-4">
              {topbarItems.map(item => {
                if (item.component) {
                  const Component = item.component;
                  return (
                    <div key={item.id} className="flex items-center">
                      <Component />
                    </div>
                  );
                }
                const Icon = item.icon ? iconMap[item.icon] : Settings;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.route) navigate(item.route);
                      if (item.action) eventBus.emit(item.action, undefined);
                    }}
                    className="p-2 text-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors flex-shrink-0"
                    aria-label={t(item.label)}
                    title={t(item.label)}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
            <div className="relative ml-2 lg:ml-4 flex-shrink-0">
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
          </div>
          <div className="flex items-center gap-2">
            <div className="relative ml-4">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}