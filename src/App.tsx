import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { coreFramework } from './core/CoreFramework';
import { LayoutProvider } from './components/LayoutProvider';
import { TokenPerimeter } from './modules/token-perimeter/TokenPerimeter';
import { LoaderModule } from './modules/loader/LoaderModule';
import './index.css';

const componentRegistry: Record<string, React.ComponentType> = {
  'TokenPerimeter': TokenPerimeter,
  'LoaderModule': LoaderModule,
};

function App() {
  useEffect(() => {
    void loadModules();
  }, []);

  const loadModules = async () => {
    await loadTokenPerimeterModule();
    await loadLoaderModule();
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

  const renderRoutes = () => {
    const routes = coreFramework.getAllRoutes();

    if (routes.length === 0) {
      return (
        <Route path="/" element={<TokenPerimeter />} />
      );
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
        <Routes>
          <Route path="/" element={<Outlet />}>
            {renderRoutes()}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LayoutProvider>
    </BrowserRouter>
  );
}

export default App;