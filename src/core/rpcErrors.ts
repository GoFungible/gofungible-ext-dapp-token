import {
  ChainDisconnectedError,
  ContractFunctionRevertedError,
  HttpRequestError,
  ProviderDisconnectedError,
  ResourceUnavailableRpcError,
  TimeoutError,
  TransactionExecutionError,
  UserRejectedRequestError,
} from 'viem';

export type RpcFailureKind =
  | 'chain_unreachable'
  | 'timeout'
  | 'rate_limited'
  | 'user_rejected'
  | 'contract_reverted'
  | 'unknown';

export interface RpcFailure {
  kind: RpcFailureKind;
  message: string;
  status?: number;
}

const NETWORK_ERROR_PATTERNS = [
  'fetch failed',
  'failed to fetch',
  'networkerror',
  'network error',
  'underlying network error',
  'econnrefused',
  'econnreset',
  'etimedout',
  'enotfound',
  'eai_again',
  'socket hang up',
  'connection refused',
  'connection closed',
  'load failed',
];

const TIMEOUT_PATTERNS = ['timeout', 'timed out', 'deadline exceeded'];

const REJECTED_PATTERNS = [
  'user rejected',
  'user denied',
  'request rejected',
  'rejected the request',
  'action_rejected',
];

function getErrorName(error: unknown): string {
  if (error && typeof error === 'object' && 'name' in error) {
    const name = (error as { name?: unknown }).name;
    if (typeof name === 'string') return name;
  }
  return error instanceof Error ? error.name : '';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'Unknown error';
}

function getErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === 'number') return status;
  }
  return undefined;
}

function matches(error: unknown, patterns: string[]): boolean {
  const haystack = `${getErrorName(error)} ${getErrorMessage(error)}`.toLowerCase();
  return patterns.some(pattern => haystack.includes(pattern));
}

export function classifyRpcFailure(error: unknown): RpcFailure {
  const message = getErrorMessage(error);
  const status = getErrorStatus(error);

  if (
    error instanceof UserRejectedRequestError ||
    getErrorName(error) === 'UserRejectedRequestError' ||
    matches(error, REJECTED_PATTERNS)
  ) {
    return { kind: 'user_rejected', message, status };
  }

  if (
    error instanceof TimeoutError ||
    getErrorName(error) === 'TimeoutError' ||
    getErrorName(error) === 'WaitForTransactionReceiptTimeoutError'
  ) {
    return { kind: 'timeout', message, status };
  }

  if (
    error instanceof ChainDisconnectedError ||
    error instanceof ProviderDisconnectedError ||
    error instanceof ResourceUnavailableRpcError
  ) {
    return { kind: 'chain_unreachable', message, status };
  }

  if (error instanceof HttpRequestError || getErrorName(error) === 'HttpRequestError') {
    if (status === 429) {
      return { kind: 'rate_limited', message, status };
    }
    if (status !== undefined && status >= 500) {
      return { kind: 'chain_unreachable', message, status };
    }
    if (status === undefined || status === 0) {
      return { kind: 'chain_unreachable', message, status };
    }
    return { kind: 'unknown', message, status };
  }

  if (
    error instanceof ContractFunctionRevertedError ||
    error instanceof TransactionExecutionError ||
    getErrorName(error) === 'ContractFunctionRevertedError'
  ) {
    return { kind: 'contract_reverted', message, status };
  }

  if (matches(error, TIMEOUT_PATTERNS)) {
    return { kind: 'timeout', message, status };
  }

  if (matches(error, NETWORK_ERROR_PATTERNS)) {
    return { kind: 'chain_unreachable', message, status };
  }

  return { kind: 'unknown', message, status };
}

export function isChainUnreachable(failure: RpcFailure): boolean {
  return failure.kind === 'chain_unreachable' || failure.kind === 'timeout';
}
