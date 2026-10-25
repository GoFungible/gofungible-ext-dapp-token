import { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react';

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

export interface Exchange {
  name: string;
  factory?: string;
  router?: string;
  factorys?: string;
  address?: string;
}

export interface Lender {
  name: string;
  address: string;
}

export interface FungibleToken {
  name: string;
  address: string;
}

export interface IcoTier {
  name: string;
  price: number;
  allocation: number;
  maxPerWallet: number;
}

export type IcoStatus = 'live' | 'closed';

export interface IcoOffering {
  id: string;
  name: string;
  chainId: number;
  chainName: string;
  tokenAddress: string;
  tokenSymbol: string;
  paymentTokenSymbol: string;
  paymentTokenAddress: string;
  price: number;
  hardCap: number;
  softCap: number;
  minContribution: number;
  maxContribution: number;
  startDate: string;
  endDate: string;
  tgeDate: string;
  tiers: IcoTier[];
  raised: number;
  sold: number;
  contributors: number;
  status: IcoStatus;
  createdAt: number;
}

export type AirdropRecipientStatus = 'pending' | 'sent' | 'claimed';

export type AirdropClaimMode = 'claim' | 'push';

export type AirdropStatus = 'live' | 'closed';

export interface AirdropRecipient {
  address: string;
  amount: number;
  status: AirdropRecipientStatus;
}

export interface AirdropCampaign {
  id: string;
  name: string;
  chainId: number;
  chainName: string;
  tokenAddress: string;
  tokenSymbol: string;
  totalAmount: number;
  distributed: number;
  minBalance: number;
  claimMode: AirdropClaimMode;
  deadline: string;
  recipients: AirdropRecipient[];
  claims: number;
  status: AirdropStatus;
  createdAt: number;
}

export type LendingOfferStatus = 'open' | 'active' | 'repaid' | 'closed';

export interface LendingOffer {
  id: string;
  name: string;
  chainId: number;
  chainName: string;
  tokenAddress: string;
  tokenSymbol: string;
  lender: string;
  lenderAddress: string;
  borrower: string;
  principal: number;
  interestRate: number;
  termDays: number;
  collateral: number;
  accruedInterest: number;
  repaid: number;
  outstanding: number;
  status: LendingOfferStatus;
  createdAt: number;
  fundedAt?: number;
  repaidAt?: number;
}

export interface VestingTranche {
  id: string;
  date: string;
  amount: number;
  released: boolean;
  releasedAt?: number;
}

export type VestingCadence = 'daily' | 'weekly' | 'monthly' | 'linear';

export type VestingScheduleStatus = 'active' | 'completed' | 'cancelled';

export interface VestingSchedule {
  id: string;
  name: string;
  chainId: number;
  chainName: string;
  tokenAddress: string;
  tokenSymbol: string;
  beneficiary: string;
  totalAmount: number;
  releasedAmount: number;
  startDate: string;
  cliffDays: number;
  durationDays: number;
  cadence: VestingCadence;
  offeringId?: string;
  offeringName?: string;
  tranches: VestingTranche[];
  status: VestingScheduleStatus;
  createdAt: number;
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
  FungibleFactory?: string;
  FungibleEnvironment?: string;
  PaymentTokens?: Record<string, PaymentToken>;
  Relayers?: Record<string, Relay>;
  Exchanges?: Record<string, Exchange>;
  Lenders?: Record<string, Lender>;
  FungibleTokens?: Record<string, FungibleToken>;
  ICOs?: Record<string, IcoOffering>;
  Airdrops?: Record<string, AirdropCampaign>;
  LendingOffers?: Record<string, LendingOffer>;
  VestingSchedules?: Record<string, VestingSchedule>;
}

interface ChainStoreContextType {
  selectedChainId: number;
  selectedChain: ChainJson | null;
  chainCache: Record<number, ChainJson>;
  selectChain: (chainId: number) => void;
  updateChainCreate2Factory: (chainId: number, entries: Record<string, { address?: string; desc?: string }>) => void;
  updateChainFungibleFactory: (chainId: number, address: string) => void;
  updateChainFungibleEnvironment: (chainId: number, address: string) => void;
  updateChainPaymentTokens: (chainId: number, tokens: Record<string, PaymentToken>) => void;
  updateChainRelayers: (chainId: number, relayers: Record<string, Relay>) => void;
  updateChainExchanges: (chainId: number, exchanges: Record<string, Exchange>) => void;
  updateChainLenders: (chainId: number, lenders: Record<string, Lender>) => void;
  updateChainFungibleTokens: (chainId: number, tokens: Record<string, FungibleToken>) => void;
  updateChainICOs: (chainId: number, icos: Record<string, IcoOffering>) => void;
  updateChainAirdrops: (chainId: number, airdrops: Record<string, AirdropCampaign>) => void;
  updateChainLendingOffers: (chainId: number, offers: Record<string, LendingOffer>) => void;
  updateChainVestingSchedules: (chainId: number, schedules: Record<string, VestingSchedule>) => void;
  resetChainCache: () => void;
}

const ChainStoreContext = createContext<ChainStoreContextType | undefined>(undefined);

const CHAIN_LOADERS: Record<string, () => Promise<{ default?: ChainJson }>> = import.meta.glob(
  '/data/*.json',
  { eager: false },
) as Record<string, () => Promise<{ default?: ChainJson }>>;

const chainIdToLoader: Record<number, () => Promise<{ default?: ChainJson }>> = {};
const chainIdToPath: Record<number, string> = {};

const loadersReady = (async () => {
  for (const [path, loader] of Object.entries(CHAIN_LOADERS)) {
    const mod = await loader();
    const chain = (mod.default ?? mod) as ChainJson;
    const existingPath = chainIdToPath[chain.id];
    if (existingPath) {
      console.error(
        `ChainStore: duplicate chain id ${chain.id} in ${path} (already defined in ${existingPath}). ` +
          `Ignoring ${path}.`
      );
      continue;
    }
    chainIdToLoader[chain.id] = loader;
    chainIdToPath[chain.id] = path;
  }
})();

const STORAGE_KEY = 'chain-cache-v1';

let chainCacheRef: Record<number, ChainJson> = {};
let selectedChainIdRef: number = 0;

function loadCacheFromStorage(): Record<number, ChainJson> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, ChainJson>;
      // Convert keys back to numbers since JSON.stringify converts them to strings
      return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [Number(k), v]));
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

export function ChainStoreProvider({ children }: { children: ReactNode }) {
  const [selectedChainId, setSelectedChainId] = useState<number>(0);
  const [chainCache, setChainCache] = useState<Record<number, ChainJson>>(() => loadCacheFromStorage());

  const selectedChain = selectedChainId > 0 ? (chainCache[selectedChainId] ?? null) : null;

  // Keep refs in sync with state for stateRegistry
  useEffect(() => {
    chainCacheRef = chainCache;
  }, [chainCache]);
  useEffect(() => {
    selectedChainIdRef = selectedChainId;
  }, [selectedChainId]);

  // Persist chainCache to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chainCache));
    } catch {
      // Ignore write errors (e.g., quota exceeded)
    }
  }, [chainCache]);

  const selectChain = useCallback(
    (chainId: number) => {
      setSelectedChainId(chainId);
      if (chainCache[chainId]) return;
      void loadersReady
        .then(() => {
          const loader = chainIdToLoader[chainId];
          if (!loader) return;
          return loader().then(mod => {
            const chain = (mod.default ?? mod) as ChainJson;
            setChainCache(prev => ({ ...prev, [chainId]: chain }));
          });
        })
        .catch(() => {});
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

  const updateChainExchanges = useCallback(
    (chainId: number, exchanges: Record<string, Exchange>) => {
      setChainCache(prev => {
        const existing = prev[chainId];
        if (!existing) return prev;
        return {
          ...prev,
          [chainId]: { ...existing, Exchanges: exchanges },
        };
      });
    },
    [],
  );

  const updateChainLenders = useCallback(
    (chainId: number, lenders: Record<string, Lender>) => {
      setChainCache(prev => {
        const existing = prev[chainId];
        if (!existing) return prev;
        return {
          ...prev,
          [chainId]: { ...existing, Lenders: lenders },
        };
      });
    },
    [],
  );

  const updateChainFungibleTokens = useCallback(
    (chainId: number, tokens: Record<string, FungibleToken>) => {
      setChainCache(prev => {
        const existing = prev[chainId];
        if (!existing) return prev;
        return {
          ...prev,
          [chainId]: { ...existing, FungibleTokens: tokens },
        };
      });
    },
    [],
  );

  const updateChainICOs = useCallback(
    (chainId: number, icos: Record<string, IcoOffering>) => {
      setChainCache(prev => {
        const existing = prev[chainId];
        if (!existing) return prev;
        return {
          ...prev,
          [chainId]: { ...existing, ICOs: icos },
        };
      });
    },
    [],
  );

  const updateChainAirdrops = useCallback(
    (chainId: number, airdrops: Record<string, AirdropCampaign>) => {
      setChainCache(prev => {
        const existing = prev[chainId];
        if (!existing) return prev;
        return {
          ...prev,
          [chainId]: { ...existing, Airdrops: airdrops },
        };
      });
    },
    [],
  );

  const updateChainLendingOffers = useCallback(
    (chainId: number, offers: Record<string, LendingOffer>) => {
      setChainCache(prev => {
        const existing = prev[chainId];
        if (!existing) return prev;
        return {
          ...prev,
          [chainId]: { ...existing, LendingOffers: offers },
        };
      });
    },
    [],
  );

  const updateChainVestingSchedules = useCallback(
    (chainId: number, schedules: Record<string, VestingSchedule>) => {
      setChainCache(prev => {
        const existing = prev[chainId];
        if (!existing) return prev;
        return {
          ...prev,
          [chainId]: { ...existing, VestingSchedules: schedules },
        };
      });
    },
    [],
  );

  const resetChainCache = useCallback(() => {
    setChainCache({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  // Expose reset function for external use (e.g., debug module)
  useEffect(() => {
    setResetChainCache(resetChainCache);
  }, [resetChainCache]);

  const value: ChainStoreContextType = {
    selectedChainId,
    selectedChain,
    chainCache,
    selectChain,
    updateChainCreate2Factory,
    updateChainFungibleFactory,
    updateChainFungibleEnvironment,
    updateChainPaymentTokens,
    updateChainRelayers,
    updateChainExchanges,
    updateChainLenders,
    updateChainFungibleTokens,
    updateChainICOs,
    updateChainAirdrops,
    updateChainLendingOffers,
    updateChainVestingSchedules,
    resetChainCache,
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

// State registry getters
export function getChainCache(): Record<number, ChainJson> {
  return chainCacheRef;
}

export function getSelectedChainId(): number {
  return selectedChainIdRef;
}

let resetChainCacheFn: () => void = () => {};

export function setResetChainCache(fn: () => void): void {
  resetChainCacheFn = fn;
}

export function resetChainCache(): void {
  resetChainCacheFn();
}
