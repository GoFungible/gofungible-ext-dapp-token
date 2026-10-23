import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { coreFramework } from './core/CoreFramework';
import { ChainStoreProvider } from './modules/chains/ChainStore';
import { FungibleTokensSync } from './modules/chains/FungibleTokensSync';
import { LayoutProvider } from './components/LayoutProvider';
import { TokenPerimeter } from './modules/token-perimeter/TokenPerimeter';
import { TokenEcosystem } from './modules/token-ecosystem/TokenEcosystem';
import { LoaderModule } from './modules/loader/LoaderModule';
import { Dashboard } from './modules/dashboard/Dashboard';
import { Environment } from './modules/environment/Environment';
import { TokenNegotiation } from './modules/token-negotiation/TokenNegotiation';


import { ThemeManager } from './modules/theme-manager/ThemeManager';
import { Loader2 } from 'lucide-react';
import './index.css';

const componentRegistry: Record<string, React.ComponentType> = {
  'TokenPerimeter': TokenPerimeter,
  'TokenEcosystem': TokenEcosystem,
  'LoaderModule': LoaderModule,
  'Dashboard': Dashboard,
  'Environment': Environment,
  'TokenNegotiation': TokenNegotiation,
  
  
  'ThemeManager': ThemeManager,
};

function App() {
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    void loadModules();
  }, []);

  const loadModules = async () => {
    await loadChainsModule();
    await loadDashboardModule();
    await loadTokenEcosystemModule();
    await loadEnvironmentModule();
    await loadTokenNegotiationModule();
    await loadTokenPerimeterModule();
    await loadLoaderModule();
    await loadDefaultThemeModule();
    await loadDarkThemeModule();
    await loadBrandThemeModule();
    await loadRetroThemeModule();
    await loadGlassThemeModule();
    await loadBrutalistThemeModule();
    await loadThemeManagerModule();
    setModulesLoaded(true);
  };

  const loadChainsModule = async () => {
    try {
      const mod = await import('./modules/chains/index');
      if (mod.default && typeof mod.default.initialize === 'function') {
        await mod.default.initialize(coreFramework);
      }
    } catch (error) {
      console.error('Failed to load chains module:', error);
    }
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

  const loadTokenEcosystemModule = async () => {
    try {
      const mod = await import('./modules/token-ecosystem/index');
      if (mod.default && typeof mod.default.initialize === 'function') {
        await mod.default.initialize(coreFramework);
      }
    } catch (error) {
      console.error('Failed to load token-ecosystem module:', error);
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

  const loadDashboardModule = async () => {
    try {
      const mod = await import('./modules/dashboard/index');
      console.log('Dashboard module loaded:', mod);
      if (mod.default && typeof mod.default.initialize === 'function') {
        await mod.default.initialize(coreFramework);
        console.log('Dashboard module initialized successfully');
      }
    } catch (error) {
      console.error('Failed to load dashboard module:', error);
    }
  };

  const loadEnvironmentModule = async () => {
    try {
      const mod = await import('./modules/environment/index');
      console.log('Environment module loaded:', mod);
      if (mod.default && typeof mod.default.initialize === 'function') {
        await mod.default.initialize(coreFramework);
        console.log('Environment module initialized successfully');
      }
    } catch (error) {
      console.error('Failed to load environment module:', error);
    }
  };

  const loadTokenNegotiationModule = async () => {
    try {
      const mod = await import('./modules/token-negotiation/index');
      console.log('TokenNegotiation module loaded:', mod);
      if (mod.default && typeof mod.default.initialize === 'function') {
        await mod.default.initialize(coreFramework);
        console.log('TokenNegotiation module initialized successfully');
      }
    } catch (error) {
      console.error('Failed to load token-negotiation module:', error);
    }
  };



  const loadThemeManagerModule = async () => {
    try {
      const mod = await import('./modules/theme-manager/index');
      if (mod.default && typeof mod.default.initialize === 'function') {
        await mod.default.initialize(coreFramework);
      }
    } catch (error) {
      console.error('Failed to load theme-manager module:', error);
    }
  };

  const loadDefaultThemeModule = async () => {
    try {
      const mod = await import('./modules/themes/default-theme');
      if (mod.default && typeof mod.default.initialize === 'function') {
        await mod.default.initialize(coreFramework);
      }
    } catch (error) {
      console.error('Failed to load default-theme module:', error);
    }
  };

  const loadDarkThemeModule = async () => {
    try {
      const mod = await import('./modules/themes/dark-theme');
      if (mod.default && typeof mod.default.initialize === 'function') {
        await mod.default.initialize(coreFramework);
      }
    } catch (error) {
      console.error('Failed to load dark-theme module:', error);
    }
  };

  const loadBrandThemeModule = async () => {
    try {
      const mod = await import('./modules/themes/brand-theme');
      if (mod.default && typeof mod.default.initialize === 'function') {
        await mod.default.initialize(coreFramework);
      }
    } catch (error) {
      console.error('Failed to load brand-theme module:', error);
    }
  };

  const loadRetroThemeModule = async () => {
    try {
      const mod = await import('./modules/themes/retro-theme');
      if (mod.default && typeof mod.default.initialize === 'function') await mod.default.initialize(coreFramework);
    } catch (error) { console.error('Failed to load retro-theme module:', error); }
  };
  const loadGlassThemeModule = async () => {
    try {
      const mod = await import('./modules/themes/glass-theme');
      if (mod.default && typeof mod.default.initialize === 'function') await mod.default.initialize(coreFramework);
    } catch (error) { console.error('Failed to load glass-theme module:', error); }
  };
  const loadBrutalistThemeModule = async () => {
    try {
      const mod = await import('./modules/themes/brutalist-theme');
      if (mod.default && typeof mod.default.initialize === 'function') await mod.default.initialize(coreFramework);
    } catch (error) { console.error('Failed to load brutalist-theme module:', error); }
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
            element={<div>{t('app.componentNotFound', { component: route.component })}</div>}
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
      <ChainStoreProvider>
        <FungibleTokensSync />
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
      </ChainStoreProvider>
    </BrowserRouter>
  );
}

export default App;