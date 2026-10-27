import { createPublicClient, http } from 'viem';
import { classifyRpcFailure, type RpcFailure } from './rpcErrors';

export type ChainHealthStatus = 'online' | 'offline' | 'mismatch' | 'unknown';

export interface ChainHealth {
  status: ChainHealthStatus;
  chainId?: number;
  expectedChainId?: number;
  failure?: RpcFailure;
  checkedAt: number;
}

export const DEFAULT_PROBE_TIMEOUT_MS = 5000;

export async function probeChain(
  rpcUrl: string,
  expectedChainId?: number,
  timeoutMs: number = DEFAULT_PROBE_TIMEOUT_MS
): Promise<ChainHealth> {
  if (!rpcUrl) {
    return { status: 'unknown', expectedChainId, checkedAt: Date.now() };
  }

  try {
    const client = createPublicClient({
      transport: http(rpcUrl, { timeout: timeoutMs, retryCount: 0 }),
    });
    const chainId = await client.getChainId();
    const status: ChainHealthStatus =
      expectedChainId !== undefined && Number(chainId) !== expectedChainId ? 'mismatch' : 'online';
    return { status, chainId, expectedChainId, checkedAt: Date.now() };
  } catch (error) {
    const failure = classifyRpcFailure(error);
    return {
      status: failure.kind === 'chain_unreachable' || failure.kind === 'timeout' ? 'offline' : 'unknown',
      expectedChainId,
      failure,
      checkedAt: Date.now(),
    };
  }
}
