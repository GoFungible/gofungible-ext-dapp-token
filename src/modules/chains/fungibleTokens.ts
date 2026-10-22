import {
  createPublicClient,
  http,
  isAddress,
  zeroAddress,
  type Abi,
  type Address,
} from 'viem';
import fungibleEnvironmentArtifact from '../../../abi/FungibleEnvironment.json';
import type { FungibleToken } from './ChainStore';

const fungibleEnvironmentAbi = fungibleEnvironmentArtifact.abi as Abi;

export async function fetchFungibleTokens(
  rpcUrl: string,
  environmentAddress: string
): Promise<Record<string, FungibleToken>> {
  const client = createPublicClient({ transport: http(rpcUrl) });
  const environment = environmentAddress as Address;

  const raw = (await client.readContract({
    address: environment,
    abi: fungibleEnvironmentAbi,
    functionName: 'getFungibles',
  })) as string[];

  const entries = Array.isArray(raw) ? raw : [];
  const tokens: Record<string, FungibleToken> = {};

  for (const entry of entries) {
    if (!entry) continue;

    if (isAddress(entry)) {
      tokens[entry] = { name: entry, address: entry };
      continue;
    }

    const resolved = (await client.readContract({
      address: environment,
      abi: fungibleEnvironmentAbi,
      functionName: 'getFungibleAddress',
      args: [entry],
    })) as Address;

    if (!isAddress(resolved) || resolved.toLowerCase() === zeroAddress.toLowerCase()) continue;
    tokens[entry] = { name: entry, address: resolved };
  }

  return tokens;
}
