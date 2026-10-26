import React from 'react';

export interface ChainInfo {
  id: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  chainId: number;
  totalSupply?: string;
  holders?: number;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  accent: string;
  border: string;
  muted: string;
}

export interface ThemeFonts {
  sans: string;
  mono: string;
  heading: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description?: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  radius: string;
  mode: 'light' | 'dark';
}

export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  entryPoint: string;
  routes?: ModuleRoute[];
  topbarItems?: TopbarItem[];
  sidebarItems?: SidebarItem[];
  extensionPoints?: string[];
  theme?: ThemeConfig;
}

export interface ModuleRoute {
  path: string;
  component: string;
  exact?: boolean;
}

export interface TopbarItem {
  id: string;
  label: string;
  icon?: string;
  action?: string;
  route?: string;
  component?: React.ComponentType<any>;
  order?: number;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  children?: SidebarItem[];
  order?: number;
  separator?: boolean;
}

export interface ExtensionPoint {
  name: string;
  implement(module: ModuleInstance): void;
}

export interface ModuleInstance {
  manifest: ModuleManifest;
  initialize(core: CoreFramework): Promise<void>;
  destroy(): Promise<void>;
  getRoutes(): ModuleRoute[];
  getTopbarItems(): TopbarItem[];
  getSidebarItems(): SidebarItem[];
}

export interface ThemeRegistry {
  register(theme: ThemeConfig): void;
  unregister(themeId: string): void;
  get(themesId: string): ThemeConfig | undefined;
  getAll(): ThemeConfig[];
  setActive(themeId: string): void;
  getActive(): ThemeConfig;
  apply(themeId: string): void;
}

export interface StateRegistry {
  register(moduleId: string, getState: () => unknown): void;
  unregister(moduleId: string): void;
  getAllState(): Record<string, unknown>;
}

export interface CoreFramework {
  registerModule(module: ModuleInstance): void;
  unregisterModule(moduleId: string): void;
  getModule(moduleId: string): ModuleInstance | undefined;
  getAllModules(): ModuleInstance[];
  eventBus: EventBus;
  layout: LayoutManager;
  theme: ThemeRegistry;
  stateRegistry: StateRegistry;
}

export interface EventBus {
  on(event: string, handler: (data: unknown) => void): void;
  off(event: string, handler: (data: unknown) => void): void;
  emit(event: string, data: unknown): void;
}

export interface LayoutManager {
  setLayout(layout: LayoutType): void;
  getLayout(): LayoutType;
  registerLayout(name: string, component: React.ComponentType<{ children: React.ReactNode }>): void;
}

export type LayoutType = 'default' | 'minimal' | 'fullscreen';

export interface ModuleLoader {
  loadFromFile(file: File): Promise<ModuleInstance>;
  loadFromZip(zipFile: File): Promise<ModuleInstance[]>;
  loadFromUrl(url: string): Promise<ModuleInstance>;
}