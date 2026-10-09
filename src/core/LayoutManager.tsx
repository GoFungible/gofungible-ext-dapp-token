import { LayoutManager, LayoutType } from '../types';
import React from 'react';

class LayoutManagerImpl implements LayoutManager {
  private currentLayout: LayoutType = 'default';
  private layouts: Map<string, React.ComponentType<{ children: React.ReactNode }>> = new Map();

  constructor() {
    this.registerLayout('default', DefaultLayout);
    this.registerLayout('minimal', MinimalLayout);
    this.registerLayout('fullscreen', FullscreenLayout);
  }

  setLayout(layout: LayoutType): void {
    this.currentLayout = layout;
  }

  getLayout(): LayoutType {
    return this.currentLayout;
  }

  registerLayout(name: string, component: React.ComponentType<{ children: React.ReactNode }>): void {
    this.layouts.set(name, component);
  }

  getLayoutComponent(name: string): React.ComponentType<{ children: React.ReactNode }> | undefined {
    return this.layouts.get(name);
  }

  getCurrentLayoutComponent(): React.ComponentType<{ children: React.ReactNode }> {
    return this.layouts.get(this.currentLayout) || DefaultLayout;
  }
}

const DefaultLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    {children}
  </div>
);

const MinimalLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-white">
    {children}
  </div>
);

const FullscreenLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="fixed inset-0 bg-gray-900">
    {children}
  </div>
);

export const layoutManager = new LayoutManagerImpl();