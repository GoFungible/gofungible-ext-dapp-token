import { useState, useCallback } from 'react';
import { useWalletClient } from 'wagmi';
import { createPublicClient, http, type Abi, type Address } from 'viem';
import fungibleEnvironmentArtifact from '../../../../abi/FungibleEnvironment.json';
import mockChains from '@data/chains';
import { useChainStore } from '../../chains/ChainStore';

interface FungibleTokenInfo {
  name: string;
  symbol: string;
  address: string;
}

interface UseFungibleTokensReturn {
  tokens: FungibleTokenInfo[];
  isLoading: boolean;
  error: string | undefined;
  fetchTokens: () => Promise<void>;
}

export function useFungibleTokens(masterChainId: number): UseFungibleTokensReturn {
  const [tokens, setTokens] = useState<FungibleTokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { data: walletClient } = useWalletClient();
  const { chainCache } = useChainStore();

  const fetchTokens = useCallback(async () => {
    if (!walletClient) {
      setError('Wallet not connected');
      return;
    }

    const chainConfig = mockChains.find(c => c.id === masterChainId);
    if (!chainConfig) {
      setError('Chain configuration not found');
      return;
    }

    const chainState = chainCache[masterChainId];
    const fungibleEnvironmentAddress = chainState?.FungibleEnvironment;

    if (!fungibleEnvironmentAddress) {
      setError('Fungible Environment not deployed on this chain');
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const publicClient = createPublicClient({
        transport: http(chainConfig.rpcUrl),
      });

      const symbols = await publicClient.readContract({
        address: fungibleEnvironmentAddress as Address,
        abi: fungibleEnvironmentArtifact.abi as Abi,
        functionName: 'getFungibles',
      });

      // For each symbol, get the token address
      const tokensInfo: FungibleTokenInfo[] = [];
      for (const symbol of symbols as string[]) {
        try {
          const address = await publicClient.readContract({
            address: fungibleEnvironmentAddress as Address,
            abi: fungibleEnvironmentArtifact.abi as Abi,
            functionName: 'getFungibleAddress',
            args: [symbol],
          });
          tokensInfo.push({
            name: symbol, // Use symbol as name for now
            symbol,
            address: address as string,
          });
        } catch {
          // If we can't get address, still add the symbol
          tokensInfo.push({
            name: symbol,
            symbol,
            address: '',
          });
        }
      }

      setTokens(tokensInfo);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tokens';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, masterChainId, chainCache]);

  return { tokens, isLoading, error, fetchTokens };
}