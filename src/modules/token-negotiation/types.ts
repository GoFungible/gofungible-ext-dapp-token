export interface ExchangePair {
  exchangeId: string;
  exchangeName: string;
  units: number;
}

export interface NegotiationChainState {
  chainId: number;
  chainName: string;
  symbol: string;
  exchanges: ExchangePair[];
}

export interface NegotiationState {
  chains: NegotiationChainState[];
  selectedChainId: number;
  isLoading: boolean;
  error?: string;
  success?: string;
}

export interface NegotiationEvent {
  chainId: number;
  chainName: string;
  exchangeId: string;
  exchangeName: string;
  units: number;
  action: 'set-units';
  timestamp: number;
}

export function formatUnits(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toLocaleString();
}

export function totalUnits(chains: NegotiationChainState[]): number {
  return chains.reduce((sum, c) => sum + c.exchanges.reduce((s, e) => s + e.units, 0), 0);
}
