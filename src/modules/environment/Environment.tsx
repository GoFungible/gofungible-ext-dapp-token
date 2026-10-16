import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  if (deployed) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
        <CheckCircle className="h-3 w-3" />
        {t('environment.deployed')}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-muted bg-gray-50 px-2 py-1 rounded-full">
      <XCircle className="h-3 w-3" />
      {t('environment.notDeployed')}
    </span>
  );
}

function AddressRow({
  address,
  deployed,
  showExplorer,
  explorer,
}: {
  address: string | null;
  deployed: boolean;
  showExplorer?: boolean;
  explorer?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <StatusBadge deployed={deployed} />
        {address ? (
          <code className="text-sm font-mono text-foreground truncate max-w-[220px]">
            {address.slice(0, 10)}...{address.slice(-8)}
          </code>
        ) : (
          <span className="text-sm text-muted font-mono">—</span>
        )}
      </div>
      {address && showExplorer && explorer && (
        <a
          href={`${explorer}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted hover:text-muted"
          aria-label={t('environment.viewOnExplorer')}
          title={t('environment.viewOnExplorer')}
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
  const { t } = useTranslation();
  const isCreate2 = form.useCreate2;
  const isAddressValid = form.tokenAddress && /^0x[a-fA-F0-9]{40}$/.test(form.tokenAddress);
  const isFormValid = isCreate2 ? !!form.create2Salt && isAddressValid : !!isAddressValid;

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-600" />
          {t('environment.tokenContract')}
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
            <span className="text-sm text-foreground">{t('environment.existingTokenAddress')}</span>
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
            <span className="text-sm text-foreground">{t('environment.deployViaCreate2')}</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('environment.tokenContractAddress')}
          </label>
          <input
            type="text"
            value={form.tokenAddress}
            onChange={e => setForm({ ...form, tokenAddress: e.target.value })}
            placeholder={isCreate2 ? t('environment.leaveEmptyToCompute') : t('common.addressPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
            disabled={isLoading}
          />
          {form.tokenAddress && !isAddressValid && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {t('environment.invalidAddress')}
            </p>
          )}
        </div>

        {isCreate2 && (
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
              {t('environment.create2Salt')}
            </label>
            <input
              type="text"
              value={form.create2Salt}
              onChange={e => setForm({ ...form, create2Salt: e.target.value })}
              placeholder={t('environment.create2SaltPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              disabled={isLoading}
            />
          </div>
        )}
      </div>

      {state.token.address && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('environment.currentTokenAddress')}
          </p>
          <AddressRow
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
          title={t('environment.deployOrRegisterToken')}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.deploying')}
            </>
          ) : state.token.deployed ? (
            t('environment.tokenDeployed')
          ) : (
            <>
            <Plus className="h-4 w-4" />
            {isCreate2 ? t('environment.deployCreate2Token') : t('environment.confirmTokenAddress')}
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
  const { t } = useTranslation();
  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-600" />
          {t('environment.fungibleProxyContract')}
        </h3>
        <StatusBadge deployed={state.fungibleProxy.deployed} />
      </div>

      <p className="text-sm text-muted">
        {t('environment.fungibleProxyDesc')}
      </p>

      {state.fungibleProxy.address && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('environment.proxyAddress')}
          </p>
          <AddressRow
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
          title={t('environment.deployFungibleProxy')}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.deploying')}
            </>
          ) : state.fungibleProxy.deployed ? (
            t('environment.proxyDeployed')
          ) : (
            <>
            <Plus className="h-4 w-4" />
            {t('environment.deployFungibleProxy')}
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
  const { t } = useTranslation();
  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Network className="h-5 w-5 text-green-600" />
          {t('environment.fungibleFactoryContract')}
        </h3>
        <StatusBadge deployed={state.fungibleFactory.deployed} />
      </div>

      <p className="text-sm text-muted">
        {t('environment.fungibleFactoryDesc')}
      </p>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <AddressRow
          address={state.fungibleFactory.address}
          deployed={state.fungibleFactory.deployed}
          showExplorer={!!explorer}
          explorer={explorer}
        />
        <div className="flex items-center gap-2 mt-2">
          <div className={state.fungibleFactory.assigned ? 'text-green-600' : 'text-muted'}>
            {state.fungibleFactory.assigned ? <CheckCircle className="h-4 w-4 inline" /> : <XCircle className="h-4 w-4 inline" />}
          </div>
          <span className="text-sm text-muted">
            {state.fungibleFactory.assigned
              ? t('environment.assignedToProxy')
              : t('environment.notAssignedToProxy')}
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onDeploy}
          disabled={isLoading || !state.fungibleProxy.deployed || state.fungibleFactory.deployed}
          className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          title={t('environment.deployAndAssignFactory')}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.deploying')}
            </>
          ) : state.fungibleFactory.deployed ? (
            t('environment.factoryDeployed')
          ) : (
            <>
            <Plus className="h-4 w-4" />
            {t('environment.deployAndAssignFactory')}
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
  const { t } = useTranslation();
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
          ? t('environment.success.tokenDeployed', { name: selectedChain?.name || '' })
          : t('environment.success.tokenAddressRegistered', { name: selectedChain?.name || '' })
      );
      setForm({ tokenAddress: '', useCreate2: true, create2Salt: 'fungible-token' });
    } catch {
      setError(t('environment.error.deployToken'));
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

      setSuccess(t('environment.success.proxyDeployed', { name: selectedChain?.name || '' }));
    } catch {
      setError(t('environment.error.deployProxy'));
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

      setSuccess(t('environment.success.factoryDeployed', { name: selectedChain?.name || '' }));
    } catch {
      setError(t('environment.error.deployFactory'));
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
        <h1 className="text-3xl font-bold text-foreground">{t('environment.title')}</h1>
        <p className="text-muted mt-1">
          {t('environment.subtitle')}
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

      <div className="bg-surface rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-xs font-medium text-muted uppercase tracking-wide">
            {t('environment.selectChain')}
          </label>
          <button
            onClick={() => {
              setSuccess(undefined);
              setError(undefined);
              eventBus.emit('refresh-environment', undefined);
            }}
            className="p-1.5 text-muted hover:text-foreground hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('common.refresh')}
            title={t('common.refresh')}
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
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono text-sm"
          disabled={activeStep !== null}
        >
          {mockChains.map(chain => (
            <option key={chain.id} value={chain.id}>
              {t('environment.chainOption', { name: chain.name, symbol: chain.symbol, id: chain.id })}
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
              <h2 className="text-xl font-semibold text-foreground">
                {t('environment.chainHeader', { name: selectedChain.name, id: selectedChain.id })}
              </h2>
              <p className="text-sm text-muted">
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
