import { createContext, useContext, useCallback, useState, ReactNode } from 'react';

export interface ChainToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  holders: number;
  priceUsd?: number;
  priceChange24h?: number;
}

export interface PaymentToken {
  name: string;
  address: string;
}

export interface Relay {
  name: string;
  address: string;
}

export interface ChainJson {
  id: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  blockExplorer: string;
  isActive: boolean;
  token?: ChainToken;
  create2Factory?: Record<string, { address?: string; desc?: string }>;
  FungibleProxy?: string;
  FungibleFactory?: string;
  FungibleEnvironment?: string;
  PaymentTokens?: Record<string, PaymentToken>;
  Relayers?: Record<string, Relay>;
}

interface ChainStoreContextType {
  selectedChainId: number;
  selectedChain: ChainJson | null;
  chainCache: Record<number, ChainJson>;
  selectChain: (chainId: number) => void;
  updateChainCreate2Factory: (chainId: number, entries: Record<string, { address?: string; desc?: string }>) => void;
  updateChainFungibleProxy: (chainId: number, address: string) => void;
  updateChainFungibleFactory: (chainId: number, address: string) => void;
  updateChainFungibleEnvironment: (chainId: number, address: string) => void;
  updateChainPaymentTokens: (chainId: number, tokens: Record<string, PaymentToken>) => void;
  updateChainRelayers: (chainId: number, relayers: Record<string, Relay>) => void;
}

const ChainStoreContext = createContext<ChainStoreContextType | undefined>(undefined);

const CHAIN_LOADERS: Record<string, () => Promise<{ default?: ChainJson }>> = import.meta.glob(
  '/data/*.json',
  { eager: false },
) as Record<string, () => Promise<{ default?: ChainJson }>>;

const chainIdToLoader: Record<number, () => Promise<{ default?: ChainJson }>> = {};

void (async () => {
  for (const loader of Object.values(CHAIN_LOADERS)) {
    const mod = await loader();
    const chain = (mod.default ?? mod) as ChainJson;
    chainIdToLoader[chain.id] = loader;
  }
})();

export function ChainStoreProvider({ children }: { children: ReactNode }) {
  const [selectedChainId, setSelectedChainId] = useState<number>(0);
  const [chainCache, setChainCache] = useState<Record<number, ChainJson>>({});

  const selectedChain = selectedChainId > 0 ? (chainCache[selectedChainId] ?? null) : null;

  const selectChain = useCallback(
    (chainId: number) => {
      setSelectedChainId(chainId);
      if (chainCache[chainId]) return;
      const loader = chainIdToLoader[chainId];
      if (!loader) return;
      void loader().then(mod => {
        const chain = (mod.default ?? mod) as ChainJson;
        setChainCache(prev => ({ ...prev, [chainId]: chain }));
      }).catch(() => {});
    },
    [chainCache],
  );

  const updateChainCreate2Factory = useCallback(
    (chainId: number, entries: Record<string, { address?: string; desc?: string }>) => {
      setChainCache(prev => {
        const existing = prev[chainId];
        if (!existing) return prev;
        const existingFactory = existing.create2Factory ?? {};
        return {
          ...prev,
          [chainId]: {
            ...existing,
            create2Factory: { ...existingFactory, ...entries },
          },
        };
      });
    },
    [],
  );

  const updateChainFungibleProxy = useCallback(
    (chainId: number, address: string) => {
      setChainCache(prev => {
        const existing = prev[chainId];
        if (!existing) return prev;
        return {
          ...prev,
          [chainId]: { ...existing, FungibleProxy: address },
        };
      });
    },
    [],
  );

  const updateChainFungibleFactory = useCallback(
    (chainId: number, address: string) => {
      setChainCache(prev => {
        const existing = prev[chainId];
        if (!existing) return prev;
        return {
          ...prev,
          [chainId]: { ...existing, FungibleFactory: address },
        };
      });
    },
    [],
  );

  const updateChainFungibleEnvironment = useCallback(
    (chainId: number, address: string) => {
      setChainCache(prev => {
        const existing = prev[chainId];
        if (!existing) return prev;
        return {
          ...prev,
          [chainId]: { ...existing, FungibleEnvironment: address },
        };
      });
    },
    [],
  );

  const updateChainPaymentTokens = useCallback(
    (chainId: number, tokens: Record<string, PaymentToken>) => {
      setChainCache(prev => {
        const existing = prev[chainId];
        if (!existing) return prev;
        return {
          ...prev,
          [chainId]: { ...existing, PaymentTokens: tokens },
        };
      });
    },
    [],
  );

  const updateChainRelayers = useCallback(
    (chainId: number, relayers: Record<string, Relay>) => {
      setChainCache(prev => {
        const existing = prev[chainId];
        if (!existing) return prev;
        return {
          ...prev,
          [chainId]: { ...existing, Relayers: relayers },
        };
      });
    },
    [],
  );

  const value: ChainStoreContextType = {
    selectedChainId,
    selectedChain,
    chainCache,
    selectChain,
    updateChainCreate2Factory,
    updateChainFungibleProxy,
    updateChainFungibleFactory,
    updateChainFungibleEnvironment,
    updateChainPaymentTokens,
    updateChainRelayers,
  };

  return (
    <ChainStoreContext.Provider value={value}>{children}</ChainStoreContext.Provider>
  );
}

export function useChainStore() {
  const context = useContext(ChainStoreContext);
  if (!context) {
    throw new Error('useChainStore must be used within a ChainStoreProvider');
  }
  return context;
}
