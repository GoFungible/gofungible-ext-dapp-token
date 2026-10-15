export const SUPPORTED_CHAIN_IDS = [1, 137, 42161, 10, 8453];

export interface EnvironmentToken {
  address: string | null;
  deployed: boolean;
  deploymentType: 'create2' | 'existing' | null;
}

export interface EnvironmentContract {
  address: string | null;
  deployed: boolean;
  assigned: boolean;
}

export interface EnvironmentChainState {
  chainId: number;
  token: EnvironmentToken;
  fungibleProxy: EnvironmentContract;
  fungibleFactory: EnvironmentContract;
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
