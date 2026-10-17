import { useState } from 'react';
import { useWalletClient } from 'wagmi';
import {
  createPublicClient,
  http,
  type Abi,
  type Address,
} from 'viem';
import create2FactoryArtifact from '../../../../abi/Create2Factory.json';

interface UseCreate2DeployReturn {
  deployCreate2Factory: (rpcUrl: string) => Promise<Address | null>;
  isDeploying: boolean;
}

export function useCreate2Deploy(): UseCreate2DeployReturn {
  const { data: walletClient } = useWalletClient();
  const [isDeploying, setIsDeploying] = useState(false);

  async function deployCreate2Factory(rpcUrl: string): Promise<Address | null> {
    if (!walletClient) {
      return null;
    }
    const account = walletClient.account;
    if (!account) {
      return null;
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
      return receipt.contractAddress ?? null;
    } catch {
      return null;
    } finally {
      setIsDeploying(false);
    }
  }

  return { deployCreate2Factory, isDeploying };
}