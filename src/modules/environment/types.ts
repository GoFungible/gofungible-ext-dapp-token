import type { Address } from 'viem';
import type { RpcFailure } from '../chains/rpcErrors';

export const SUPPORTED_CHAIN_IDS = [1, 137, 42161, 10, 8453, 56];

export type DeployOutcome =
  | { ok: true; address: Address }
  | { ok: false; failure: RpcFailure };

export interface EnvironmentToken {
  address: string | null;
  deployed: boolean;
  deploymentType: 'create2' | 'existing' | null;
}

export interface EnvironmentContract {
  address: string | null;
  deployed: boolean;
  assigned?: boolean;
}

export interface Create2FactoryEntry {
  address: string;
  desc?: string;
}

export interface EnvironmentChainState {
  chainId: number;
  token: EnvironmentToken;
  create2Factory: {
    entries: Record<string, Create2FactoryEntry>;
    deployed: boolean;
  };
  fungibleFactory: EnvironmentContract;
  fungibleEnvironment: EnvironmentContract;
}

export interface EnvironmentState {
  chains: EnvironmentChainState[];
  selectedChainId: number;
  isLoading: boolean;
  error?: string;
  success?: string;
}

export interface EnvironmentFormData {
  tokenAddress: string;
  useCreate2: boolean;
  create2Salt: string;
}

export interface DeployStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
}
