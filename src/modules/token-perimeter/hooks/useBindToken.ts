import { useCallback } from 'react';
import { useWalletClient, useAccount } from 'wagmi';
import { createPublicClient, http, type Abi, type Address, type Chain } from 'viem';
import fungibleArtifact from '../../../../abi/Fungible.json';
import mockChains from '@data/chains';
import { useChainStore } from '../../chains/ChainStore';
import { useToast } from '../../../core/toast/ToastContext';
import { useAddChain } from '../../environment/hooks/useAddChain';

export function useBindToken() {
  const { data: walletClient } = useWalletClient();
  const { chain: connectedChain } = useAccount();
  const { chainCache } = useChainStore();
  const { addToast, updateToast } = useToast();
  const { addChain, switchChain } = useAddChain();

  const bind = useCallback(async (
    masterChainId: number,
    masterTokenAddress: string,
    slaveChainId: number,
    slaveTokenAddress: string
  ) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    const masterChainConfig = mockChains.find(c => c.id === masterChainId);
    if (!masterChainConfig) {
      throw new Error('Master chain configuration not found');
    }

    const masterChainState = chainCache[masterChainId];
    const fungibleEnvironmentAddress = masterChainState?.FungibleEnvironment;
    if (!fungibleEnvironmentAddress) {
      throw new Error('Fungible Environment not deployed on master chain');
    }

    const toastId = addToast({
      type: 'pending',
      title: 'Binding Token',
      message: `Binding token on ${masterChainConfig.name}...`,
      chainId: masterChainId,
      functionName: 'bind',
    });

    try {
      updateToast(toastId, { message: 'Checking wallet chain...' });

      // Auto-switch to master chain if needed
      const isChainConnected = connectedChain?.id === masterChainId;
      if (!isChainConnected) {
        updateToast(toastId, { message: 'Switching to master chain...' });
        
        const chain: Chain = {
          id: masterChainConfig.id,
          name: masterChainConfig.name,
          nativeCurrency: { name: masterChainConfig.symbol, symbol: masterChainConfig.symbol, decimals: 18 },
          rpcUrls: { default: { http: [masterChainConfig.rpcUrl] } },
          blockExplorers: masterChainConfig.blockExplorer ? { default: { name: 'Explorer', url: masterChainConfig.blockExplorer } } : undefined,
        };
        
        await addChain(chain);
        await switchChain(masterChainId);
      }

      updateToast(toastId, { message: 'Calling bind on master token...' });

      const publicClient = createPublicClient({
        transport: http(masterChainConfig.rpcUrl),
      });

      const hash = await walletClient.writeContract({
        address: masterTokenAddress as Address,
        abi: fungibleArtifact.abi as Abi,
        functionName: 'bind',
        args: [BigInt(slaveChainId), slaveTokenAddress as Address],
        account: walletClient.account,
        chain: { id: masterChainId } as any,
      });

      updateToast(toastId, { message: 'Waiting for transaction...' });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        updateToast(toastId, {
          type: 'success',
          title: 'Token Bound',
          message: `Successfully bound token on chain ${slaveChainId}`,
        });
        return { ok: true, hash };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to bind token';
      updateToast(toastId, {
        type: 'error',
        title: 'Bind Failed',
        message,
      });
      throw err;
    }
  }, [walletClient, connectedChain, chainCache, addToast, updateToast, addChain, switchChain]);

  return { bind };
}