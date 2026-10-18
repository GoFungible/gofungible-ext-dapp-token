import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';
import { mainnet, polygon, arbitrum, optimism, base, sepolia, bsc } from 'wagmi/chains';

export const anvil1 = defineChain({
  id: 1111,
  name: 'Anvil1',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
  iconUrl: '/gofungible-ext-dapp-token/icons/anvil1.svg',
  iconBackground: '#ffffff',
});

export const anvil2 = defineChain({
  id: 2222,
  name: 'Anvil2',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8546'] } },
  iconUrl: '/gofungible-ext-dapp-token/icons/anvil2.svg',
  iconBackground: '#ffffff',
});

export const wagmiConfig = getDefaultConfig({
  appName: 'Gofungible Ext DApp Token',
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID ?? 'YOUR_PROJECT_ID',
  chains: [mainnet, polygon, arbitrum, optimism, base, sepolia, bsc, anvil1, anvil2],
  ssr: true,
});
