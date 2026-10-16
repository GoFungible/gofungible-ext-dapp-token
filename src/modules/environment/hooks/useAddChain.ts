import { useState } from 'react';
import { useWalletClient } from 'wagmi';
import type { Chain } from 'viem';

interface UseAddChainReturn {
  addChain: (chain: Chain) => Promise<boolean>;
  switchChain: (chainId: number) => Promise<boolean>;
  isAdding: boolean;
  error: string | undefined;
}

export function useAddChain(): UseAddChainReturn {
  const { data: walletClient } = useWalletClient();
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function requestWallet(method: string, params: unknown[]): Promise<boolean> {
    if (!walletClient) {
      setError('Wallet not connected');
      return false;
    }
    setIsAdding(true);
    setError(undefined);
    try {
      const request = walletClient.request as unknown as (args: {
        method: string;
        params: unknown[];
      }) => Promise<unknown>;
      await request({ method, params });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed';
      setError(message);
      return false;
    } finally {
      setIsAdding(false);
    }
  }

  async function addChain(chain: Chain): Promise<boolean> {
    return requestWallet('wallet_addEthereumChain', [
      {
        chainId: `0x${chain.id.toString(16)}`,
        chainName: chain.name,
        nativeCurrency: chain.nativeCurrency,
        rpcUrls: chain.rpcUrls.default.http,
        ...(chain.blockExplorers
          ? { blockExplorerUrls: [chain.blockExplorers.default.url] }
          : {}),
      },
    ]);
  }

  async function switchChain(chainId: number): Promise<boolean> {
    return requestWallet('wallet_switchEthereumChain', [
      { chainId: `0x${chainId.toString(16)}` },
    ]);
  }

  return { addChain, switchChain, isAdding, error };
}
