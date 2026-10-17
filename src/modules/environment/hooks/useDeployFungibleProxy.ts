import { useState } from 'react';
import { useWalletClient } from 'wagmi';
import {
  createPublicClient,
  http,
  type Abi,
  type Address,
  encodeDeployData,
  stringToHex,
  pad,
  decodeEventLog,
} from 'viem';
import create2FactoryArtifact from '../../../../abi/Create2Factory.json';
import fungibleProxyArtifact from '../../../../abi/FungibleProxy.json';

interface UseDeployFungibleProxyReturn {
  deployFungibleProxy: (params: {
    factoryAddress: Address;
    rpcUrl: string;
    implementation: Address;
    salt: string;
  }) => Promise<Address | null>;
  isDeploying: boolean;
}

export function useDeployFungibleProxy(): UseDeployFungibleProxyReturn {
  const { data: walletClient } = useWalletClient();
  const [isDeploying, setIsDeploying] = useState(false);

  async function deployFungibleProxy(params: {
    factoryAddress: Address;
    rpcUrl: string;
    implementation: Address;
    salt: string;
  }): Promise<Address | null> {
    if (!walletClient) return null;
    const account = walletClient.account;
    if (!account) return null;

    setIsDeploying(true);
    try {
      const publicClient = createPublicClient({
        transport: http(params.rpcUrl),
      });

      const initCode = encodeDeployData({
        abi: fungibleProxyArtifact.abi as Abi,
        bytecode: fungibleProxyArtifact.bytecode as `0x${string}`,
        args: [params.implementation],
      });

      const saltBytes32 = pad(stringToHex(params.salt), { size: 32 });

      const hash = await walletClient.writeContract({
        address: params.factoryAddress,
        abi: create2FactoryArtifact.abi as Abi,
        functionName: 'deploy',
        args: [initCode, saltBytes32],
        account,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const factoryLogs = receipt.logs.filter(
        log => log.address === params.factoryAddress
      );
      for (const log of factoryLogs) {
        try {
          const event = decodeEventLog({
            abi: create2FactoryArtifact.abi,
            data: log.data,
            topics: [...log.topics] as [`0x${string}`, ...`0x${string}`[]],
          });
          if (event.eventName === 'Deployed') {
            return (event.args as unknown as { contractAddress: Address }).contractAddress;
          }
        } catch {
          continue;
        }
      }

      return null;
    } catch {
      return null;
    } finally {
      setIsDeploying(false);
    }
  }

  return { deployFungibleProxy, isDeploying };
}
