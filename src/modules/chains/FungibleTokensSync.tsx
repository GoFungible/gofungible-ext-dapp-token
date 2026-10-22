import { useCallback, useEffect, useRef } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { eventBus } from '../../core/EventBus';
import { useChainStore } from './ChainStore';
import { fetchFungibleTokens } from './fungibleTokens';

export function FungibleTokensSync() {
  const { isConnected } = useAccount();
  const walletChainId = useChainId();
  const { chainCache, selectChain, updateChainFungibleTokens } = useChainStore();
  const syncedEnvironmentRef = useRef<Record<number, string>>({});

  const syncChain = useCallback(
    async (chainId: number) => {
      const chain = chainCache[chainId];
      const environmentAddress = chain?.FungibleEnvironment;
      if (!chain || !environmentAddress) return;
      if (syncedEnvironmentRef.current[chainId] === environmentAddress) return;

      try {
        const tokens = await fetchFungibleTokens(chain.rpcUrl, environmentAddress);
        syncedEnvironmentRef.current[chainId] = environmentAddress;
        if (Object.keys(tokens).length === 0) return;
        const current = chain.FungibleTokens ?? {};
        if (JSON.stringify(current) === JSON.stringify(tokens)) return;
        updateChainFungibleTokens(chainId, tokens);
      } catch (error) {
        console.warn('Chains: unable to read the fungible tokens of the chain', error);
      }
    },
    [chainCache, updateChainFungibleTokens]
  );

  useEffect(() => {
    if (!isConnected || !walletChainId) return;
    const chainId = Number(walletChainId);
    if (!chainCache[chainId]) {
      void selectChain(chainId);
      return;
    }
    void syncChain(chainId);
  }, [isConnected, walletChainId, chainCache, selectChain, syncChain]);

  useEffect(() => {
    const handler = (data: unknown) => {
      const chainId = (data as { chainId?: number } | undefined)?.chainId;
      if (typeof chainId !== 'number') return;
      void syncChain(chainId);
    };
    eventBus.on('environment:environment-deployed', handler);
    return () => eventBus.off('environment:environment-deployed', handler);
  }, [syncChain]);

  return null;
}
