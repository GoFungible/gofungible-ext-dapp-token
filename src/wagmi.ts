import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, arbitrum, optimism, base, sepolia } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'Gofungible Ext DApp Token',
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID ?? 'YOUR_PROJECT_ID',
  chains: [mainnet, polygon, arbitrum, optimism, base, sepolia],
  ssr: true,
});
