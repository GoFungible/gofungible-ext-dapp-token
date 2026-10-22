import { useState } from 'react';
import { useWalletClient } from 'wagmi';
import {
  createPublicClient,
  http,
  type Abi,
} from 'viem';
import create2FactoryArtifact from '../../../../abi/Create2Factory.json';
import { classifyRpcFailure } from '../../chains/rpcErrors';
import type { DeployOutcome } from '../types';

interface UseCreate2DeployReturn {
  deployCreate2Factory: (rpcUrl: string) => Promise<DeployOutcome>;
  isDeploying: boolean;
}

export function useCreate2Deploy(): UseCreate2DeployReturn {
  const { data: walletClient } = useWalletClient();
  const [isDeploying, setIsDeploying] = useState(false);

  async function deployCreate2Factory(rpcUrl: string): Promise<DeployOutcome> {
    if (!walletClient) {
      return { ok: false, failure: { kind: 'unknown', message: 'Wallet not connected' } };
    }
    const account = walletClient.account;
    if (!account) {
      return { ok: false, failure: { kind: 'unknown', message: 'Wallet has no account' } };
    }
    setIsDeploying(true);
    try {
      const publicClient = createPublicClient({
        transport: http(rpcUrl),
      });
      const hash = await walletClient.deployContract({
        abi: create2FactoryArtifact.abi as Abi,
        bytecode: create2FactoryArtifact.bytecode as `0x${string}`,
        account,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const address = receipt.contractAddress;
      if (!address) {
        return {
          ok: false,
          failure: { kind: 'unknown', message: 'Deployment receipt has no contract address' },
        };
      }
      return { ok: true, address };
    } catch (error) {
      return { ok: false, failure: classifyRpcFailure(error) };
    } finally {
      setIsDeploying(false);
    }
  }

  return { deployCreate2Factory, isDeploying };
}
