import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLayout } from './LayoutProvider';
import { SidebarItem } from '../types';
import { ChevronDown, LayoutDashboard, Settings, Network, FileText, Plus, ArrowRightLeft, Palette, Coins, PanelLeftClose, PanelLeftOpen, Rocket, Gift, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'layout-dashboard': LayoutDashboard,
  'settings': Settings,
  'network': Network,
  'file-text': FileText,
  'plus': Plus,
  'arrow-right-left': ArrowRightLeft,
  'palette': Palette,
  'rocket': Rocket,
  'gift': Gift,
  'landmark': Landmark,
};

function SidebarItemComponent({ item, level = 0, collapsed }: { item: SidebarItem; level?: number; collapsed: boolean }) {
  const { closeSidebar } = useLayout();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const Icon = item.icon ? iconMap[item.icon] : LayoutDashboard;
  const hasChildren = item.children && item.children.length > 0;
  const [expanded, setExpanded] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!hasChildren && item.route) {
      navigate(item.route);
      closeSidebar();
    } else if (hasChildren) {
      e.preventDefault();
      setExpanded(!expanded);
    } else {
      closeSidebar();
    }
  };

  return (
    <div className={level > 0 ? 'ml-4' : ''}>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors ${collapsed ? 'justify-center' : ''}`}
        title={collapsed ? t(item.label) : undefined}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && (
          <span className="flex-1 truncate font-medium">{t(item.label)}</span>
        )}
        {hasChildren && !collapsed && (
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        )}
      </button>
      {hasChildren && expanded && !collapsed && (
        <div className="mt-1 space-y-1">
          {item.children!.map(child => (
            <SidebarItemComponent key={child.id} item={child} level={level + 1} collapsed={collapsed} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { sidebarOpen, closeSidebar, sidebarItems, openLoader, sidebarCollapsed, toggleSidebarCollapsed } = useLayout();
  const { t } = useTranslation();
  const collapsed = sidebarCollapsed;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 bg-surface border-r border-border transform transition-all duration-200 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${collapsed ? 'w-16' : 'w-64'}`}
      aria-label={t('sidebar.closeSidebar')}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-blue-600 flex-shrink-0" />
            {!collapsed && <h1 className="text-xl font-bold text-foreground">{t('sidebar.appTitle')}</h1>}
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 text-muted hover:text-foreground"
            aria-label={t('sidebar.closeSidebar')}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 max-h-full" aria-label="Main navigation">
          {sidebarItems.length === 0 ? (
            <div className="text-center text-muted py-8">
              <p className="text-sm">{t('sidebar.noModulesLoaded')}</p>
              <p className="text-xs mt-1">{t('sidebar.loadModuleToSeeNav')}</p>
            </div>
          ) : (
            sidebarItems.map(item => (
              <SidebarItemComponent key={item.id} item={item} collapsed={collapsed} />
            ))
          )}
          <div className="border-t border-gray-200 my-4" />
          <button
            onClick={openLoader}
            className={`w-full flex items-center gap-2 px-3 py-2 text-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium ${collapsed ? 'justify-center' : ''}`}
            aria-label={t('sidebar.loadNewModuleAria')}
            title={collapsed ? t('sidebar.loadNewModule') : undefined}
          >
            <Plus className="h-5 w-5" />
            {!collapsed && <span>{t('sidebar.loadNewModule')}</span>}
          </button>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-muted text-center">
            {!collapsed ? t('sidebar.version') : 'v1.0'}
          </p>
        </div>
      </div>
      <button
        onClick={toggleSidebarCollapsed}
        className="hidden lg:flex absolute bottom-4 -right-3 z-50 items-center justify-center w-6 h-6 bg-surface border border-gray-200 rounded-full shadow-md text-muted hover:text-foreground transition-colors"
        aria-label={collapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
        title={collapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}