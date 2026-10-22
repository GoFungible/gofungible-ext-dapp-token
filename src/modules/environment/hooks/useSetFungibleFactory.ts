import { useState } from 'react';
import { useWalletClient } from 'wagmi';
import {
  createPublicClient,
  http,
  type Abi,
  type Address,
} from 'viem';
import fungibleEnvironmentArtifact from '../../../../abi/FungibleEnvironment.json';
import { classifyRpcFailure } from '../../chains/rpcErrors';
import type { ContractCallOutcome } from '../types';

interface SetFungibleFactoryParams {
  rpcUrl: string;
  environmentAddress: string;
  factoryAddress: string;
}

interface UseSetFungibleFactoryReturn {
  setFungibleFactory: (params: SetFungibleFactoryParams) => Promise<ContractCallOutcome>;
  isAssigning: boolean;
}

const fungibleEnvironmentAbi = fungibleEnvironmentArtifact.abi as Abi;

export function useSetFungibleFactory(): UseSetFungibleFactoryReturn {
  const { data: walletClient } = useWalletClient();
  const [isAssigning, setIsAssigning] = useState(false);

  async function setFungibleFactory({
    rpcUrl,
    environmentAddress,
    factoryAddress,
  }: SetFungibleFactoryParams): Promise<ContractCallOutcome> {
    if (!walletClient) {
      return { ok: false, failure: { kind: 'unknown', message: 'Wallet not connected' } };
    }
    const account = walletClient.account;
    if (!account) {
      return { ok: false, failure: { kind: 'unknown', message: 'Wallet has no account' } };
    }
    setIsAssigning(true);
    try {
      const publicClient = createPublicClient({
        transport: http(rpcUrl),
      });
      const environment = environmentAddress as Address;

      const hash = await walletClient.writeContract({
        address: environment,
        abi: fungibleEnvironmentAbi,
        functionName: 'setFungibleFactory',
        args: [factoryAddress as Address],
        account,
      });

      await publicClient.waitForTransactionReceipt({ hash });

      const assigned = (await publicClient.readContract({
        address: environment,
        abi: fungibleEnvironmentAbi,
        functionName: 'getFungibleFactory',
      })) as Address;

      if (!assigned || assigned.toLowerCase() !== factoryAddress.toLowerCase()) {
        return {
          ok: false,
          failure: { kind: 'unknown', message: 'FungibleEnvironment did not store the FungibleFactory address' },
        };
      }

      return { ok: true, hash };
    } catch (error) {
      return { ok: false, failure: classifyRpcFailure(error) };
    } finally {
      setIsAssigning(false);
    }
  }

  return { setFungibleFactory, isAssigning };
}
