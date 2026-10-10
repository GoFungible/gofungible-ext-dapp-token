import React from 'react';
import { useLayout } from './LayoutProvider';
import { Menu, Settings, Bell, User, ChevronDown, Network, RefreshCw } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'menu': Menu,
  'settings': Settings,
  'bell': Bell,
  'user': User,
  'chevron-down': ChevronDown,
  'network': Network,
  'refresh-cw': RefreshCw,
};

export function Topbar() {
  const { sidebarOpen, toggleSidebar, topbarItems } = useLayout();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
            Gofungible Ext DApp Token
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {topbarItems.map(item => {
            const Icon = item.icon ? iconMap[item.icon] : Settings;
            return (
              <button
                key={item.id}
                onClick={() => item.action && console.log(`Action: ${item.action}`)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={item.label}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
          <div className="hidden sm:flex items-center gap-1 ml-4">
            <Network className="h-5 w-5 text-gray-400" />
            <select className="px-2 py-1 text-sm text-gray-700 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ethereum">Ethereum Mainnet</option>
              <option value="polygon">Polygon</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="optimism">Optimism</option>
              <option value="base">Base</option>
            </select>
          </div>
          <div className="relative ml-4">
            <button className="flex items-center gap-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">Admin</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}