import { useState } from 'react';
import { useWalletClient } from 'wagmi';
import { createPublicClient, http, keccak256, toBytes, type Abi, type Address } from 'viem';
import fungibleEnvironmentArtifact from '../../../../abi/FungibleEnvironment.json';
import mockChains from '@data/chains';
import { useChainStore } from '../../chains/ChainStore';
import { useAddChain } from '../../environment/hooks/useAddChain';

interface UseCreateFungibleTokenParams {
  name: string;
  supply: string;
  isMaster: boolean;
  masterChainId: number;
}

interface UseCreateFungibleTokenReturn {
  createFungibleToken: (params: UseCreateFungibleTokenParams) => Promise<{ ok: boolean; address?: Address; error?: string }>;
  isCreating: boolean;
}

export function useCreateFungibleToken(): UseCreateFungibleTokenReturn {
  const [isCreating, setIsCreating] = useState(false);
  const { data: walletClient } = useWalletClient();
  const { addChain, switchChain } = useAddChain();
  const { chainCache } = useChainStore();

  async function createFungibleToken(params: UseCreateFungibleTokenParams): Promise<{ ok: boolean; address?: Address; error?: string }> {
    const { name, supply, masterChainId } = params;

    if (!name.trim()) {
      return { ok: false, error: 'Token name is required' };
    }
    if (!walletClient) {
      return { ok: false, error: 'Wallet not connected' };
    }

    const chainConfig = mockChains.find(c => c.id === masterChainId);
    if (!chainConfig) {
      return { ok: false, error: 'Chain configuration not found' };
    }

    const chainState = chainCache[masterChainId];
    const fungibleEnvironmentAddress = chainState?.FungibleEnvironment;

    if (!fungibleEnvironmentAddress) {
      return { ok: false, error: 'Fungible Environment not deployed on this chain' };
    }

    setIsCreating(true);
    try {
      const isChainConnected = walletClient.chain?.id === masterChainId;
      if (!isChainConnected) {
        const chain = {
          id: chainConfig.id,
          name: chainConfig.name,
          nativeCurrency: { name: chainConfig.symbol, symbol: chainConfig.symbol, decimals: 18 },
          rpcUrls: { default: { http: [chainConfig.rpcUrl] } },
          blockExplorers: chainConfig.blockExplorer ? { default: { name: 'Explorer', url: chainConfig.blockExplorer } } : undefined,
        };
        
        const added = await addChain(chain);
        if (added) {
          await switchChain(masterChainId);
        }
      }

      const publicClient = createPublicClient({
        transport: http(chainConfig.rpcUrl),
      });

      const salt = keccak256(toBytes(name || ''));
      const supplyBigInt = BigInt(supply || '0');
      const symbol = name.substring(0, 10).toUpperCase();

      const hash = await walletClient.writeContract({
        address: fungibleEnvironmentAddress as Address,
        abi: fungibleEnvironmentArtifact.abi as Abi,
        functionName: 'createFungible',
        args: [name, symbol, supplyBigInt, salt],
        account: walletClient.account,
      });

      await publicClient.waitForTransactionReceipt({ hash });

      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create token';
      return { ok: false, error: message };
    } finally {
      setIsCreating(false);
    }
  }

  return { createFungibleToken, isCreating };
}