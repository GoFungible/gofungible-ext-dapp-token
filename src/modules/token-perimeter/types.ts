export const MASTER_CHAIN_ID = 1;

export interface ChainData {
  id: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  blockExplorer: string;
  isActive: boolean;
  token?: TokenData;
}

export interface TokenData {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  holders: number;
  priceUsd?: number;
  priceChange24h?: number;
}

export interface PerimeterState {
  chains: ChainData[];
  isLoading: boolean;
  error?: string;
  success?: string;
}

export interface PerimeterEvent {
  chainId: number;
  chainName: string;
  action: 'bind' | 'unbind';
  timestamp: number;
}

export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toLocaleString();
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}