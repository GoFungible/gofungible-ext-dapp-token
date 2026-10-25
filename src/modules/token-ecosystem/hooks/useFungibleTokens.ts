import { useState, useCallback } from 'react';
import { useWalletClient } from 'wagmi';
import { createPublicClient, http, type Abi, type Address } from 'viem';
import fungibleEnvironmentArtifact from '../../../../abi/FungibleEnvironment.json';
import mockChains from '@data/chains';
import { useChainStore, type FungibleToken } from '../../chains/ChainStore';
import { useToast } from '../../../core/toast/ToastContext';

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

export function useFungibleTokens(masterChainId: number | null): UseFungibleTokensReturn {
  const [tokens, setTokens] = useState<FungibleTokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { data: walletClient } = useWalletClient();
  const { chainCache, updateChainFungibleTokens } = useChainStore();
  const { addToast, updateToast } = useToast();

  const fetchTokens = useCallback(async () => {
    if (!masterChainId) {
      return;
    }

    const chainConfig = mockChains.find(c => c.id === masterChainId);
    if (!chainConfig) {
      setError('Chain configuration not found');
      addToast({
        type: 'error',
        title: 'Chain configuration not found',
        message: 'Chain configuration not found on this chain',
        chainId: masterChainId,
        functionName: 'getFungibles',
      });
      return;
    }

    const chainState = chainCache[masterChainId];
    const fungibleEnvironmentAddress = chainState?.FungibleEnvironment;

    if (!fungibleEnvironmentAddress) {
      setError('Fungible Environment not deployed on this chain');
      addToast({
        type: 'error',
        title: 'Fungible Environment not deployed',
        message: 'Fungible Environment not deployed on this chain',
        chainId: masterChainId,
        functionName: 'getFungibles',
      });
      return;
    }
    if (!walletClient) {
      addToast({
        type: 'error',
        title: 'WalletClient is not defined',
        message: 'WalletClient is not defined. Please connect your wallet.',
        chainId: masterChainId,
        functionName: 'getFungibles',
      });
      return;
    }

    setIsLoading(true);
    setError(undefined);

    const toastId = addToast({
      type: 'pending',
      title: 'Fetching Tokens',
      message: `Loading tokens from ${chainConfig.name}`,
      chainId: masterChainId,
      functionName: 'getFungibles',
    });

    try {
      const publicClient = createPublicClient({
        transport: http(chainConfig.rpcUrl),
      });

      updateToast(toastId, { message: 'Calling getFungibles...' });

      const symbols = await publicClient.readContract({
        address: fungibleEnvironmentAddress as Address,
        abi: fungibleEnvironmentArtifact.abi as Abi,
        functionName: 'getFungibles',
        account: walletClient.account,
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
            account: walletClient.account,
          });
          tokensInfo.push({
            name: symbol,
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
      // Update chain cache with fungible tokens
      const fungibleTokensRecord: Record<string, FungibleToken> = {};
      tokensInfo.forEach(t => {
        fungibleTokensRecord[t.symbol] = { name: t.name, address: t.address };
      });
      updateChainFungibleTokens(masterChainId, fungibleTokensRecord);
      
      updateToast(toastId, { 
        type: 'success', 
        title: 'Tokens Loaded', 
        message: `Found ${tokensInfo.length} tokens on ${chainConfig.name}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tokens';
      setError(message);
      updateToast(toastId, { 
        type: 'error', 
        title: 'Failed to Fetch Tokens', 
        message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, masterChainId, chainCache, updateChainFungibleTokens, addToast, updateToast]);

  return { tokens, isLoading, error, fetchTokens };
}