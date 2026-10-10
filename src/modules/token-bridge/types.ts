import { ChainData } from '../token-perimeter/types';

export interface BridgeState {
  fromChain: ChainData | null;
  toChain: ChainData | null;
  amount: string;
  isLoading: boolean;
  error: string | undefined;
  success: string | undefined;
}

export interface BridgeTransaction {
  id: string;
  fromChainId: number;
  toChainId: number;
  fromAddress: string;
  toAddress: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  txHash?: string;
}

export const SUPPORTED_CHAINS: ChainData[] = [
  {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    isActive: true,
    token: {
      address: '0x1234567890123456789012345678901234567890',
      name: 'Gofungible Token',
      symbol: 'GFT',
      decimals: 18,
      totalSupply: '1000000000000000000000000',
      holders: 15420,
      priceUsd: 1.23,
      priceChange24h: 2.45,
    },
  },
  {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    isActive: true,
    token: {
      address: '0x2345678901234567890123456789012345678901',
      name: 'Gofungible Token',
      symbol: 'GFT',
      decimals: 18,
      totalSupply: '500000000000000000000000',
      holders: 8930,
      priceUsd: 1.22,
      priceChange24h: -1.23,
    },
  },
  {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    isActive: true,
    token: {
      address: '0x3456789012345678901234567890123456789012',
      name: 'Gofungible Token',
      symbol: 'GFT',
      decimals: 18,
      totalSupply: '200000000000000000000000',
      holders: 4560,
      priceUsd: 1.24,
      priceChange24h: 0.87,
    },
  },
  {
    id: 10,
    name: 'Optimism',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    isActive: false,
    token: {
      address: '0x4567890123456789012345678901234567890123',
      name: 'Gofungible Token',
      symbol: 'GFT',
      decimals: 18,
      totalSupply: '100000000000000000000000',
      holders: 2100,
      priceUsd: 1.21,
      priceChange24h: -0.56,
    },
  },
  {
    id: 8453,
    name: 'Base',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    isActive: true,
    token: {
      address: '0x5678901234567890123456789012345678901234',
      name: 'Gofungible Token',
      symbol: 'GFT',
      decimals: 18,
      totalSupply: '300000000000000000000000',
      holders: 3420,
      priceUsd: 1.25,
      priceChange24h: 3.12,
    },
  },
];

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

export function parseAmount(amount: string, decimals: number): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = (fraction + '0'.repeat(decimals)).slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

export function formatAmount(amount: bigint, decimals: number): string {
  const str = amount.toString().padStart(decimals + 1, '0');
  const whole = str.slice(0, -decimals) || '0';
  const fraction = str.slice(-decimals).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
}