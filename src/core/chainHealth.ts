import { createPublicClient, http } from 'viem';
import { classifyRpcFailure, type RpcFailure } from './rpcErrors';

export type ChainHealthStatus = 'online' | 'offline' | 'unknown';

export interface ChainHealth {
  status: ChainHealthStatus;
  chainId?: number;
  failure?: RpcFailure;
  checkedAt: number;
}

export const DEFAULT_PROBE_TIMEOUT_MS = 5000;

export async function probeChain(
  rpcUrl: string,
  timeoutMs: number = DEFAULT_PROBE_TIMEOUT_MS
): Promise<ChainHealth> {
  if (!rpcUrl) {
    return { status: 'unknown', checkedAt: Date.now() };
  }

  try {
    const client = createPublicClient({
      transport: http(rpcUrl, { timeout: timeoutMs, retryCount: 0 }),
    });
    const chainId = await client.getChainId();
    return { status: 'online', chainId, checkedAt: Date.now() };
  } catch (error) {
    const failure = classifyRpcFailure(error);
    return {
      status: failure.kind === 'chain_unreachable' || failure.kind === 'timeout' ? 'offline' : 'unknown',
      failure,
      checkedAt: Date.now(),
    };
  }
}
