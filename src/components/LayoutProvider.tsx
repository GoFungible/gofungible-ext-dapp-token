import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { coreFramework } from '../core/CoreFramework';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { LoaderModule } from '../modules/loader/LoaderModule';
import { SidebarItem, TopbarItem } from '../types';

interface LayoutContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  sidebarItems: SidebarItem[];
  topbarItems: TopbarItem[];
  showLoader: boolean;
  openLoader: () => void;
  closeLoader: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [topbarItems, setTopbarItems] = useState<TopbarItem[]>([]);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const updateItems = () => {
      setSidebarItems(coreFramework.getAllSidebarItems());
      setTopbarItems(coreFramework.getAllTopbarItems());
    };

    updateItems();
    
    const unsubscribeModuleRegistered = coreFramework.eventBus.on('module:registered', updateItems);
    const unsubscribeModuleUnregistered = coreFramework.eventBus.on('module:unregistered', updateItems);

    return () => {
      unsubscribeModuleRegistered();
      unsubscribeModuleUnregistered();
    };
  }, []);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);
  const openLoader = () => setShowLoader(true);
  const closeLoader = () => setShowLoader(false);

  return (
    <LayoutContext.Provider value={{
      sidebarOpen,
      toggleSidebar,
      closeSidebar,
      sidebarItems,
      topbarItems,
      showLoader,
      openLoader,
      closeLoader,
    }}>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-6 lg:p-8">
            {children}
          </main>
        </div>
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}
        {showLoader && (
          <LoaderModule onClose={closeLoader} />
        )}
      </div>
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}