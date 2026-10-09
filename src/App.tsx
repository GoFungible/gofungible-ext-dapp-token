import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { coreFramework } from './core/CoreFramework';
import { LayoutProvider } from './components/LayoutProvider';
import { Dashboard } from './modules/dashboard/Dashboard';
import './index.css';

function App() {
  useEffect(() => {
    void loadDashboardModule();
  }, []);

  const loadDashboardModule = async () => {
    try {
      await import('./modules/dashboard/index');
    } catch (error) {
      console.error('Failed to load dashboard module:', error);
    }
  };

  const renderRoutes = () => {
    const routes = coreFramework.getAllRoutes();
    
    if (routes.length === 0) {
      return (
        <Route path="/" element={<Dashboard />} />
      );
    }

    return routes.map((route, index) => (
      <Route
        key={index}
        path={route.path}
        element={
          <RouteComponent componentName={route.component} />
        }
      />
    ));
  };

  return (
    <BrowserRouter>
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

const RouteComponent: React.FC<{ componentName: string }> = ({ componentName }) => {
  return <div>Loading component: {componentName}</div>;
};

export default App;