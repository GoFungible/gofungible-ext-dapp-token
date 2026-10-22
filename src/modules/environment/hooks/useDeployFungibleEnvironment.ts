import { useState } from 'react';
import { useWalletClient } from 'wagmi';
import {
  createPublicClient,
  decodeEventLog,
  http,
  keccak256,
  toBytes,
  type Abi,
  type Address,
  type Hex,
} from 'viem';
import fungibleEnvironmentArtifact from '../../../../abi/FungibleEnvironment.json';
import create2FactoryArtifact from '../../../../abi/Create2Factory.json';
import { classifyRpcFailure } from '../../chains/rpcErrors';
import type { DeployOutcome } from '../types';

interface DeployFungibleEnvironmentParams {
  rpcUrl: string;
  factoryAddress?: string;
  salt?: string;
}

interface UseDeployFungibleEnvironmentReturn {
  deployFungibleEnvironment: (params: DeployFungibleEnvironmentParams) => Promise<DeployOutcome>;
  isDeploying: boolean;
}

const create2FactoryAbi = create2FactoryArtifact.abi as Abi;

const create2FactoryDeployedEventAbi = [
  {
    type: 'event',
    name: 'Deployed',
    inputs: [{ indexed: false, name: 'contractAddress', type: 'address' }],
  },
] as const;

function readDeployedAddress(logs: readonly { data: Hex; topics: readonly Hex[] }[]): Address | undefined {
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: create2FactoryDeployedEventAbi,
        data: log.data,
        topics: log.topics as [Hex, ...Hex[]],
      });
      if (decoded.eventName === 'Deployed') {
        const address = decoded.args.contractAddress;
        if (address) return address;
      }
    } catch {
      continue;
    }
  }
  return undefined;
}

export function useDeployFungibleEnvironment(): UseDeployFungibleEnvironmentReturn {
  const { data: walletClient } = useWalletClient();
  const [isDeploying, setIsDeploying] = useState(false);

  async function deployFungibleEnvironment({
    rpcUrl,
    factoryAddress,
    salt,
  }: DeployFungibleEnvironmentParams): Promise<DeployOutcome> {
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
      const bytecode = fungibleEnvironmentArtifact.bytecode as Hex;

      if (factoryAddress) {
        const factory = factoryAddress as Address;
        const salt32 = keccak256(toBytes(salt || ''));
        const args = [bytecode, salt32] as const;

        await publicClient.simulateContract({
          address: factory,
          abi: create2FactoryAbi,
          functionName: 'deploy',
          args,
          account,
        });

        const hash = await walletClient.writeContract({
          address: factory,
          abi: create2FactoryAbi,
          functionName: 'deploy',
          args,
          account,
        });
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        const address = readDeployedAddress(receipt.logs);
        if (!address) {
          return {
            ok: false,
            failure: { kind: 'unknown', message: 'Deployment receipt has no Deployed event' },
          };
        }
        return { ok: true, address };
      }

      const hash = await walletClient.deployContract({
        abi: fungibleEnvironmentArtifact.abi as Abi,
        bytecode,
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

  return { deployFungibleEnvironment, isDeploying };
}
