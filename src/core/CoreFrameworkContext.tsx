import { createContext, useContext, ReactNode } from 'react';
import { coreFramework } from './CoreFramework';
import { CoreFramework } from '../types';

const CoreFrameworkContext = createContext<CoreFramework | null>(null);

export function CoreFrameworkProvider({ children }: { children: ReactNode }) {
  return (
    <CoreFrameworkContext.Provider value={coreFramework}>
      {children}
    </CoreFrameworkContext.Provider>
  );
}

export function useCoreFramework(): CoreFramework {
  const ctx = useContext(CoreFrameworkContext);
  if (!ctx) {
    throw new Error('useCoreFramework must be used within a CoreFrameworkProvider');
  }
  return ctx;
}