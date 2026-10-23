import { useState } from 'react';
import { useWalletClient } from 'wagmi';
import { createPublicClient, http, keccak256, toBytes, type Abi, type Address } from 'viem';
import fungibleEnvironmentArtifact from '../../../../abi/FungibleEnvironment.json';
import mockChains from '@data/chains';
import { useChainStore } from '../../chains/ChainStore';
import { useAddChain } from '../../environment/hooks/useAddChain';
import { useToast } from '../../../core/toast/ToastContext';

interface UseCreateFungibleTokenParams {
  name: string;
  supply: string;
  isMaster: boolean;
  masterChainId: number | null;
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
  const { addToast, updateToast } = useToast();

  async function createFungibleToken(params: UseCreateFungibleTokenParams): Promise<{ ok: boolean; address?: Address; error?: string }> {
    const { name, supply, masterChainId } = params;

    if (!name.trim()) {
      return { ok: false, error: 'Token name is required' };
    }
    if (!walletClient) {
      return { ok: false, error: 'Wallet not connected' };
    }
    if (!masterChainId) {
      return { ok: false, error: 'Master chain not selected' };
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
    
    const toastId = addToast({
      type: 'pending',
      title: 'Creating Token',
      message: `Creating "${name}" on ${chainConfig.name}`,
      chainId: masterChainId,
      functionName: 'createFungible',
      data: { name, supply, symbol: name.substring(0, 10).toUpperCase(), salt: 'keccak256(name)' },
    });

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
        
        updateToast(toastId, { message: 'Adding/switching chain...' });
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

      updateToast(toastId, { message: 'Submitting transaction...' });

      const hash = await walletClient.writeContract({
        address: fungibleEnvironmentAddress as Address,
        abi: fungibleEnvironmentArtifact.abi as Abi,
        functionName: 'createFungible',
        args: [name, symbol, supplyBigInt, salt],
        account: walletClient.account,
      });

      updateToast(toastId, { message: `Transaction submitted: ${hash.slice(0, 10)}...`, data: { ...{ name, supply, symbol, salt }, txHash: hash } });

      await publicClient.waitForTransactionReceipt({ hash });

      updateToast(toastId, { 
        type: 'success', 
        title: 'Token Created', 
        message: `Successfully created "${name}" on ${chainConfig.name}`,
      });

      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create token';
      updateToast(toastId, { 
        type: 'error', 
        title: 'Token Creation Failed', 
        message,
      });
      return { ok: false, error: message };
    } finally {
      setIsCreating(false);
    }
  }

  return { createFungibleToken, isCreating };
}