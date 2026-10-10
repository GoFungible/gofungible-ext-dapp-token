import React from 'react';
import { useLayout } from './LayoutProvider';
import { SidebarItem } from '../types';
import { ChevronDown, LayoutDashboard, Settings, Network, FileText, Plus, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'layout-dashboard': LayoutDashboard,
  'settings': Settings,
  'network': Network,
  'file-text': FileText,
  'plus': Plus,
  'arrow-right-left': ArrowRightLeft,
};

function SidebarItemComponent({ item, level = 0 }: { item: SidebarItem; level?: number }) {
  const { closeSidebar } = useLayout();
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
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="flex-1 truncate font-medium">{item.label}</span>
        {hasChildren && (
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        )}
      </button>
      {hasChildren && expanded && (
        <div className="mt-1 space-y-1">
          {item.children!.map(child => (
            <SidebarItemComponent key={child.id} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { sidebarOpen, closeSidebar, sidebarItems, openLoader } = useLayout();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label="Sidebar navigation"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Fungible Standard</h1>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
            aria-label="Close sidebar"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2" aria-label="Main navigation">
          {sidebarItems.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">No modules loaded</p>
              <p className="text-xs mt-1">Load a module to see navigation items</p>
            </div>
          ) : (
            sidebarItems.map(item => (
              <SidebarItemComponent key={item.id} item={item} />
            ))
          )}
          <div className="border-t border-gray-200 my-4" />
          <button
            onClick={openLoader}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
            aria-label="Load new module"
          >
            <Plus className="h-5 w-5" />
            <span>Load New Module</span>
          </button>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Gofungible Ext DApp Token v1.0.0
          </p>
        </div>
      </div>
    </aside>
  );
}