import { useState } from 'react';
import { useWalletClient } from 'wagmi';
import {
  createPublicClient,
  http,
  type Abi,
  type Address,
} from 'viem';
import fungibleFactoryArtifact from '../../../../abi/FungibleFactory.json';

interface UseDeployFungibleFactoryReturn {
  deployFungibleFactory: (rpcUrl: string) => Promise<Address | null>;
  isDeploying: boolean;
}

export function useDeployFungibleFactory(): UseDeployFungibleFactoryReturn {
  const { data: walletClient } = useWalletClient();
  const [isDeploying, setIsDeploying] = useState(false);

  async function deployFungibleFactory(rpcUrl: string): Promise<Address | null> {
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
        abi: fungibleFactoryArtifact.abi as Abi,
        bytecode: fungibleFactoryArtifact.bytecode as `0x${string}`,
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

  return { deployFungibleFactory, isDeploying };
}