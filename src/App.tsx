import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { coreFramework } from './core/CoreFramework';
import { LayoutProvider } from './components/LayoutProvider';
import { TokenPerimeter } from './modules/token-perimeter/TokenPerimeter';
import { LoaderModule } from './modules/loader/LoaderModule';
import { TokenBridge } from './modules/token-bridge/TokenBridge';
import { Loader2 } from 'lucide-react';
import './index.css';

const componentRegistry: Record<string, React.ComponentType> = {
  'TokenPerimeter': TokenPerimeter,
  'LoaderModule': LoaderModule,
  'TokenBridge': TokenBridge,
};

function App() {
  const [modulesLoaded, setModulesLoaded] = useState(false);

  useEffect(() => {
    void loadModules();
  }, []);

  const loadModules = async () => {
    await loadTokenPerimeterModule();
    await loadLoaderModule();
    await loadTokenBridgeModule();
    setModulesLoaded(true);
  };

  const loadTokenPerimeterModule = async () => {
    try {
      const mod = await import('./modules/token-perimeter/index');
      if (mod.default && typeof mod.default.initialize === 'function') {
        await mod.default.initialize(coreFramework);
      }
    } catch (error) {
      console.error('Failed to load token-perimeter module:', error);
    }
  };

  const loadLoaderModule = async () => {
    try {
      const mod = await import('./modules/loader/index');
      if (mod.default && typeof mod.default.initialize === 'function') {
        await mod.default.initialize(coreFramework);
      }
    } catch (error) {
      console.error('Failed to load loader module:', error);
    }
  };

  const loadTokenBridgeModule = async () => {
    try {
      const mod = await import('./modules/token-bridge/index');
      console.log('Token bridge module loaded:', mod);
      if (mod.default && typeof mod.default.initialize === 'function') {
        await mod.default.initialize(coreFramework);
        console.log('TokenBridge module initialized successfully');
      }
    } catch (error) {
      console.error('Failed to load token-bridge module:', error);
    }
  };

  const renderRoutes = () => {
    const routes = coreFramework.getAllRoutes();

    if (routes.length === 0) {
      return <Route path="/" element={<TokenPerimeter />} />;
    }

    return routes.map((route, index) => {
      const Component = componentRegistry[route.component];
      if (!Component) {
        return (
          <Route
            key={index}
            path={route.path}
            element={<div>Component not found: {route.component}</div>}
          />
        );
      }
      return (
        <Route
          key={index}
          path={route.path}
          element={<Component />}
        />
      );
    });
  };

  return (
    <BrowserRouter basename="/gofungible-ext-dapp-token/">
      <LayoutProvider>
        {!modulesLoaded ? (
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
        ) : (
          <Routes>
            {renderRoutes()}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </LayoutProvider>
    </BrowserRouter>
  );
}

export default App;