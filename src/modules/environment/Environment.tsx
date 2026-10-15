import { useState, useEffect } from 'react';
import {
  Network,
  Settings,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  EnvironmentChainState,
  EnvironmentToken,
  EnvironmentContract,
} from './types';
import { eventBus } from '../../core/EventBus';
import mockChains from '@data/chains.json';

function StatusBadge({ deployed }: { deployed: boolean }) {
  if (deployed) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
        <CheckCircle className="h-3 w-3" />
        Deployed
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
      <XCircle className="h-3 w-3" />
      Not deployed
    </span>
  );
}

function AddressRow({
  label,
  address,
  deployed,
  showExplorer,
  explorer,
}: {
  label: string;
  address: string | null;
  deployed: boolean;
  showExplorer?: boolean;
  explorer?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <StatusBadge deployed={deployed} />
        {address ? (
          <code className="text-sm font-mono text-gray-700 truncate max-w-[220px]">
            {address.slice(0, 10)}...{address.slice(-8)}
          </code>
        ) : (
          <span className="text-sm text-gray-400 font-mono">—</span>
        )}
      </div>
      {address && showExplorer && explorer && (
        <a
          href={`${explorer}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-600"
          aria-label={`View ${label} on explorer`}
          title="View on explorer"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

function TokenDeployment({
  state,
  form,
  setForm,
  onSubmit,
  isLoading,
  explorer,
}: {
  state: EnvironmentChainState;
  form: {
    tokenAddress: string;
    useCreate2: boolean;
    create2Salt: string;
  };
  setForm: (form: {
    tokenAddress: string;
    useCreate2: boolean;
    create2Salt: string;
  }) => void;
  onSubmit: () => void;
  isLoading: boolean;
  explorer: string;
}) {
  const isCreate2 = form.useCreate2;
  const isAddressValid = form.tokenAddress && /^0x[a-fA-F0-9]{40}$/.test(form.tokenAddress);
  const isFormValid = isCreate2 ? !!form.create2Salt && isAddressValid : !!isAddressValid;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-600" />
          Token Contract (Create2Token)
        </h3>
        <StatusBadge deployed={state.token.deployed} />
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="deployment-type"
              checked={!isCreate2}
              onChange={() => setForm({ ...form, useCreate2: false })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              disabled={isLoading}
            />
            <span className="text-sm text-gray-700">Existing token address</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="deployment-type"
              checked={isCreate2}
              onChange={() => setForm({ ...form, useCreate2: true })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              disabled={isLoading}
            />
            <span className="text-sm text-gray-700">Deploy via Create2</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Token Contract Address
          </label>
          <input
            type="text"
            value={form.tokenAddress}
            onChange={e => setForm({ ...form, tokenAddress: e.target.value })}
            placeholder={isCreate2 ? 'Leave empty to compute' : '0x...'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
            disabled={isLoading}
          />
          {form.tokenAddress && !isAddressValid && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Invalid Ethereum address
            </p>
          )}
        </div>

        {isCreate2 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Create2 Salt
            </label>
            <input
              type="text"
              value={form.create2Salt}
              onChange={e => setForm({ ...form, create2Salt: e.target.value })}
              placeholder="e.g. my-token-salt"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              disabled={isLoading}
            />
          </div>
        )}
      </div>

      {state.token.address && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Current Token Address
          </p>
          <AddressRow
            label="Token"
            address={state.token.address}
            deployed={state.token.deployed}
            showExplorer={!!explorer}
            explorer={explorer}
          />
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onSubmit}
          disabled={isLoading || !isFormValid || state.token.deployed}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          title="Deploy or register token contract"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deploying...
            </>
          ) : state.token.deployed ? (
            'Token Deployed'
          ) : (
            <>
            <Plus className="h-4 w-4" />
            {isCreate2 ? 'Deploy Create2Token' : 'Confirm Token Address'}
          </>
          )}
        </button>
      </div>
    </div>
  );
}

function FungibleProxyDeployment({
  state,
  onDeploy,
  isLoading,
  explorer,
}: {
  state: EnvironmentChainState;
  onDeploy: () => void;
  isLoading: boolean;
  explorer: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-600" />
          FungibleProxy Contract
        </h3>
        <StatusBadge deployed={state.fungibleProxy.deployed} />
      </div>

      <p className="text-sm text-gray-500">
        Deploy a FungibleProxy contract initialized with the Create2Token.
        The proxy delegates calls to the token logic contract.
      </p>

      {state.fungibleProxy.address && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Proxy Address
          </p>
          <AddressRow
            label="FungibleProxy"
            address={state.fungibleProxy.address}
            deployed={state.fungibleProxy.deployed}
            showExplorer={!!explorer}
            explorer={explorer}
          />
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onDeploy}
          disabled={isLoading || !state.token.deployed || state.fungibleProxy.deployed}
          className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          title="Deploy FungibleProxy contract"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deploying...
            </>
          ) : state.fungibleProxy.deployed ? (
            'Proxy Deployed'
          ) : (
            <>
            <Plus className="h-4 w-4" />
            Deploy FungibleProxy
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function FungibleFactoryDeployment({
  state,
  onDeploy,
  isLoading,
  explorer,
}: {
  state: EnvironmentChainState;
  onDeploy: () => void;
  isLoading: boolean;
  explorer: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Network className="h-5 w-5 text-green-600" />
          FungibleFactory Contract
        </h3>
        <StatusBadge deployed={state.fungibleFactory.deployed} />
      </div>

      <p className="text-sm text-gray-500">
        Deploy a FungibleFactory contract and assign it to the FungibleProxy.
        The factory gates creation of new Fungible Standard Tokens on this chain.
      </p>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <AddressRow
          label="FungibleFactory"
          address={state.fungibleFactory.address}
          deployed={state.fungibleFactory.deployed}
          showExplorer={!!explorer}
          explorer={explorer}
        />
        <div className="flex items-center gap-2 mt-2">
          <div className={state.fungibleFactory.assigned ? 'text-green-600' : 'text-gray-400'}>
            {state.fungibleFactory.assigned ? <CheckCircle className="h-4 w-4 inline" /> : <XCircle className="h-4 w-4 inline" />}
          </div>
          <span className="text-sm text-gray-600">
            {state.fungibleFactory.assigned
              ? 'Assigned to FungibleProxy'
              : 'Not assigned to FungibleProxy'}
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onDeploy}
          disabled={isLoading || !state.fungibleProxy.deployed || state.fungibleFactory.deployed}
          className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          title="Deploy FungibleFactory and assign to FungibleProxy"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deploying...
            </>
          ) : state.fungibleFactory.deployed ? (
            'Factory Deployed'
          ) : (
            <>
            <Plus className="h-4 w-4" />
            Deploy &amp; Assign Factory
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function deployTokenPlaceholder(chainName: string): string {
  return `0x${chainName.replace(/\s+/g, '').toLowerCase().slice(0, 40).padEnd(40, '0')}`;
}

function deployProxyPlaceholder(): string {
  return `0x${'a'.repeat(40)}`;
}

function deployFactoryPlaceholder(): string {
  return `0x${'b'.repeat(40)}`;
}

export function Environment() {
  const [chainStates, setChainStates] = useState<EnvironmentChainState[]>([]);
  const [selectedChainId, setSelectedChainId] = useState<number>(0);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [form, setForm] = useState({
    tokenAddress: '',
    useCreate2: true,
    create2Salt: 'fungible-token',
  });

  useEffect(() => {
    const initial: EnvironmentChainState[] = mockChains.map(c => ({
      chainId: c.id,
      token: {
        address: c.token?.address || null,
        deployed: !!c.token?.address,
        deploymentType: c.token?.address ? 'existing' : null,
      },
      fungibleProxy: { address: null, deployed: false, assigned: false },
      fungibleFactory: { address: null, deployed: false, assigned: false },
    }));
    setChainStates(initial);
    setSelectedChainId(initial[0].chainId);
  }, []);

  useEffect(() => {
    const unsubscribe = eventBus.on('refresh-environment', () => {
      const refreshed = mockChains.map(c => ({
        chainId: c.id,
        token: {
          address: c.token?.address || null,
          deployed: !!c.token?.address,
          deploymentType: c.token?.address ? 'existing' : null,
        } as EnvironmentToken,
        fungibleProxy: { address: null, deployed: false, assigned: false } as EnvironmentContract,
        fungibleFactory: { address: null, deployed: false, assigned: false } as EnvironmentContract,
      }));
      setChainStates(refreshed);
    });
    return () => unsubscribe();
  }, []);

  const selectedState = chainStates.find(c => c.chainId === selectedChainId);
  const selectedChain = mockChains.find(c => c.id === selectedChainId);
  const explorer = selectedChain?.blockExplorer || '';

  const handleDeployToken = async () => {
    if (!selectedState) return;

    setActiveStep('token');
    setError(undefined);
    setSuccess(undefined);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newState = { ...selectedState };
      if (form.useCreate2) {
        newState.token = {
          address: deployTokenPlaceholder(selectedChain?.name || ''),
          deployed: true,
          deploymentType: 'create2',
        };
      } else {
        newState.token = {
          address: form.tokenAddress,
          deployed: true,
          deploymentType: 'existing',
        };
      }

      setChainStates(prev =>
        prev.map(c => (c.chainId === selectedChainId ? newState : c))
      );

      eventBus.emit('environment:token-deployed', {
        chainId: selectedChainId,
        chainName: selectedChain?.name,
        deploymentType: newState.token.deploymentType,
        timestamp: Date.now(),
      });

      setSuccess(
        form.useCreate2
          ? `Create2Token deployed on ${selectedChain?.name}`
          : `Token address registered on ${selectedChain?.name}`
      );
      setForm({ tokenAddress: '', useCreate2: true, create2Salt: 'fungible-token' });
    } catch {
      setError('Failed to deploy token contract. Please try again.');
    } finally {
      setActiveStep(null);
    }
  };

  const handleDeployProxy = async () => {
    if (!selectedState) return;

    setActiveStep('proxy');
    setError(undefined);
    setSuccess(undefined);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newState = { ...selectedState };
      newState.fungibleProxy = {
        address: deployProxyPlaceholder(),
        deployed: true,
        assigned: true,
      };

      setChainStates(prev =>
        prev.map(c => (c.chainId === selectedChainId ? newState : c))
      );

      eventBus.emit('environment:proxy-deployed', {
        chainId: selectedChainId,
        chainName: selectedChain?.name,
        timestamp: Date.now(),
      });

      setSuccess(`FungibleProxy deployed on ${selectedChain?.name}`);
    } catch {
      setError('Failed to deploy FungibleProxy. Please try again.');
    } finally {
      setActiveStep(null);
    }
  };

  const handleDeployFactory = async () => {
    if (!selectedState) return;

    setActiveStep('factory');
    setError(undefined);
    setSuccess(undefined);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newState = { ...selectedState };
      newState.fungibleFactory = {
        address: deployFactoryPlaceholder(),
        deployed: true,
        assigned: true,
      };

      setChainStates(prev =>
        prev.map(c => (c.chainId === selectedChainId ? newState : c))
      );

      eventBus.emit('environment:factory-deployed', {
        chainId: selectedChainId,
        chainName: selectedChain?.name,
        timestamp: Date.now(),
      });

      setSuccess(
        `FungibleFactory deployed and assigned to FungibleProxy on ${selectedChain?.name}`
      );
    } catch {
      setError('Failed to deploy FungibleFactory. Please try again.');
    } finally {
      setActiveStep(null);
    }
  };

  if (!selectedState || !selectedChain) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Environment</h1>
        <p className="text-gray-500 mt-1">
          Manage the contract environment of a chain. Deploy a Create2Token, a
          FungibleProxy, and a FungibleFactory, then assign the factory to the
          proxy.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Select Chain
          </label>
          <button
            onClick={() => {
              setSuccess(undefined);
              setError(undefined);
              eventBus.emit('refresh-environment', undefined);
            }}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <select
          value={selectedChainId}
          onChange={e => {
            setSelectedChainId(Number(e.target.value));
            setSuccess(undefined);
            setError(undefined);
            setForm({
              tokenAddress:
                chainStates.find(c => c.chainId === Number(e.target.value))
                  ?.token.address || '',
              useCreate2: true,
              create2Salt: 'fungible-token',
            });
          }}
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono text-sm"
          disabled={activeStep !== null}
        >
          {mockChains.map(chain => (
            <option key={chain.id} value={chain.id}>
              {chain.name} ({chain.symbol}) • Chain ID: {chain.id}
            </option>
          ))}
        </select>
      </div>

      {selectedChain && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Network className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedChain.name} • Chain ID: {selectedChain.id}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedChain.rpcUrl}
              </p>
            </div>
          </div>

          <TokenDeployment
            state={selectedState}
            form={form}
            setForm={setForm}
            onSubmit={handleDeployToken}
            isLoading={activeStep === 'token'}
            explorer={explorer}
          />

          <FungibleProxyDeployment
            state={selectedState}
            onDeploy={handleDeployProxy}
            isLoading={activeStep === 'proxy'}
            explorer={explorer}
          />

          <FungibleFactoryDeployment
            state={selectedState}
            onDeploy={handleDeployFactory}
            isLoading={activeStep === 'factory'}
            explorer={explorer}
          />
        </div>
      )}
    </div>
  );
}
