import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useChains, useChainId } from 'wagmi';
import type { Address } from 'viem';
import {
  Network,
  Settings,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import {
  EnvironmentChainState,
} from './types';
import { eventBus } from '../../core/EventBus';
import mockChains from '@data/chains';
import { useCreate2Deploy } from './hooks/useCreate2Deploy';
import { useDeployFungibleProxy } from './hooks/useDeployFungibleProxy';
import { useAddChain } from './hooks/useAddChain';
import { useChainStore } from '../../core/ChainStore';

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
  onDeploy,
  isLoading,
  explorer,
  chainAdded,
}: {
  state: EnvironmentChainState;
  onDeploy: () => void;
  isLoading: boolean;
  explorer: string;
  chainAdded: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-600" />
          {t('environment.tokenContract')}
        </h3>
        <StatusBadge deployed={state.create2Factory.deployed} />
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('environment.currentCreate2FactoryAddress')}
          </p>
          <div className="space-y-1">
            {Object.keys(state.create2Factory.entries).length > 0 ? (
              Object.entries(state.create2Factory.entries).map(([key, entry]) => (
                <div key={key} className="flex items-center gap-1">
                  <span className="text-xs text-muted">{key}</span>
                  <AddressRow
                    address={entry.address}
                    deployed={true}
                    showExplorer={!!explorer}
                    explorer={explorer}
                  />
                </div>
              ))
            ) : (
              <span className="text-xs text-muted">{t('environment.noCreate2FactoryAddresses')}</span>
            )}
          </div>
        </div>

      <div className="flex justify-end">
        <button
          onClick={onDeploy}
          disabled={isLoading || !chainAdded}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          title={t('environment.deployCreate2Factory')}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.deploying')}
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              {t('environment.deployCreate2Factory')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function FungibleProxyDeployment({
  state,
  create2Salt,
  setCreate2Salt,
  onDeploy,
  isLoading,
  explorer,
  factories,
  selectedFactory,
  setSelectedFactory,
}: {
  state: EnvironmentChainState;
  create2Salt: string;
  setCreate2Salt: (value: string) => void;
  onDeploy: () => void;
  isLoading: boolean;
  explorer: string;
  factories: { label: string; address: string; desc?: string }[];
  selectedFactory: string;
  setSelectedFactory: (value: string) => void;
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

      <div>
        <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
          {t('environment.create2FactorySelect')}
        </label>
        <select
          value={selectedFactory}
          onChange={e => setSelectedFactory(e.target.value)}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white"
        >
          <option value="">{t('environment.create2FactorySelectPlaceholder')}</option>
          {factories.map(f => (
            <option key={f.address} value={f.address}>
              {f.label} - {f.address.slice(0, 10)}...{f.address.slice(-8)}
            </option>
          ))}
        </select>
        {selectedFactory && (
          <p className="mt-2 text-xs text-muted">
            {factories.find(f => f.address === selectedFactory)?.desc}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
          {t('environment.create2Salt')}
        </label>
        <input
          type="text"
          value={create2Salt}
          onChange={e => setCreate2Salt(e.target.value)}
          placeholder={t('environment.create2SaltPlaceholder')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
          disabled={isLoading}
        />
      </div>

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
          disabled={isLoading || !selectedFactory || !create2Salt}
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

function deployFactoryPlaceholder(): string {
  return `0x${'b'.repeat(40)}`;
}

export function Environment() {
  const { t } = useTranslation();
  const [chainStates, setChainStates] = useState<EnvironmentChainState[]>([]);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const { selectedChainId, selectedChain, selectChain, updateChainCreate2Factory } = useChainStore();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [form, setForm] = useState({
    tokenAddress: '',
    useCreate2: true,
    create2Salt: 'fungible-token',
    selectedCreate2Factory: '',
  });
  const environmentInitializedRef = useRef(false);

  const { deployCreate2Factory, isDeploying: isDeployingCreate2 } = useCreate2Deploy();
  const { deployFungibleProxy, isDeploying: isDeployingProxy } = useDeployFungibleProxy();

  function buildCreate2Factory(
  cfg: { create2Factory?: Record<string, { address?: string; desc?: string }> } | null,
): EnvironmentChainState['create2Factory'] {
  if (!cfg?.create2Factory) {
    return { entries: {}, deployed: false };
  }
  const entries: Record<string, { address: string; desc?: string }> = {};
  for (const [key, val] of Object.entries(cfg.create2Factory)) {
    if (val?.address) {
      entries[key] = { address: val.address, desc: val.desc };
    }
  }
  return { entries, deployed: Object.keys(entries).length > 0 };
}

  useEffect(() => {
    if (environmentInitializedRef.current) return;
    environmentInitializedRef.current = true;
    const initial: EnvironmentChainState[] = mockChains.map(c => {
      const cfg = c as { create2Factory?: Record<string, { address?: string; desc?: string }> };
      const create2Factory = buildCreate2Factory(cfg);
      return {
        chainId: c.id,
        token: {
          address: null,
          deployed: false,
          deploymentType: null,
        },
        create2Factory,
        fungibleProxy: { address: null, deployed: false, assigned: false },
        fungibleFactory: { address: null, deployed: false, assigned: false },
      };
    });
    setChainStates(initial);
    void selectChain(initial[0].chainId);
  }, [selectChain]);

  useEffect(() => {
    const unsubscribe = eventBus.on('refresh-environment', () => {
      const refreshed: EnvironmentChainState[] = mockChains.map(c => {
        const cfg = c as { create2Factory?: Record<string, { address?: string; desc?: string }> };
        const create2Factory = buildCreate2Factory(cfg);
        return {
          chainId: c.id,
          token: {
            address: null,
            deployed: false,
            deploymentType: null,
          },
          create2Factory,
          fungibleProxy: { address: null, deployed: false, assigned: false },
          fungibleFactory: { address: null, deployed: false, assigned: false },
        };
      });
      setChainStates(refreshed);
    });
    return () => unsubscribe();
  }, []);

  const connectedChains = useChains();
  const activeChainId = useChainId();

  useEffect(() => {
    if (!activeChainId) return;
    void selectChain(Number(activeChainId));
  }, [activeChainId, selectChain]);

  const { addChain, switchChain, isAdding: isAddingChain, error: addChainError } =
    useAddChain();

  const selectedState = chainStates.find(c => c.chainId === selectedChainId);
  const isChainAdded = selectedChain ? connectedChains.some(c => c.id === selectedChainId) : false;
  const explorer = selectedChain?.blockExplorer || '';

  const availableFactories: { label: string; address: string; desc?: string }[] = [];
  if (selectedChain?.create2Factory) {
    for (const [key, val] of Object.entries(selectedChain.create2Factory)) {
      if (val?.address) {
        availableFactories.push({ label: key, address: val.address, desc: val.desc });
      }
    }
  }

  const handleAddChain = async () => {
    if (!selectedChain) return;
    const chain = {
      id: selectedChain.id,
      name: selectedChain.name,
      nativeCurrency: { name: selectedChain.symbol, symbol: selectedChain.symbol, decimals: 18 },
      rpcUrls: { default: { http: [selectedChain.rpcUrl] } },
    };
    setError(undefined);
    const added = await addChain(chain);
    if (added) {
      const switched = await switchChain(selectedChainId);
      if (!switched) {
        setError(t('environment.error.addChainToWallet'));
      }
    }
  };

  const handleDeployToken = async () => {
    if (!selectedState || !selectedChain || !deployCreate2Factory) return;
    if (!isChainAdded) {
      setError(t('environment.chainNotAdded', { name: selectedChain.name }));
      return;
    }

    setActiveStep('token');
    setError(undefined);
    setSuccess(undefined);

    try {
      const factoryAddress = await deployCreate2Factory(selectedChain.rpcUrl);
      if (!factoryAddress) {
        setError(t('environment.error.deployToken'));
        return;
      }

      updateChainCreate2Factory(selectedChainId, {
        [factoryAddress]: { address: factoryAddress },
      });

      const newState = { ...selectedState };
      newState.token = {
        address: factoryAddress,
        deployed: true,
        deploymentType: 'create2',
      };
      newState.create2Factory = {
        entries: {
          ...selectedState.create2Factory.entries,
          [factoryAddress]: { address: factoryAddress },
        },
        deployed: true,
      };

      setChainStates(prev =>
        prev.map(c => (c.chainId === selectedChainId ? newState : c))
      );

      eventBus.emit('environment:token-deployed', {
        chainId: selectedChainId,
        chainName: selectedChain?.name,
        deploymentType: 'create2',
        timestamp: Date.now(),
      });

      setSuccess(
        t('environment.success.tokenDeployed', { name: selectedChain?.name || '' })
      );
      setForm({ tokenAddress: '', useCreate2: true, create2Salt: 'fungible-token', selectedCreate2Factory: '' });
    } catch {
      setError(t('environment.error.deployToken'));
    } finally {
      setActiveStep(null);
    }
  };

  const handleDeployProxy = async () => {
    if (!selectedState || !selectedChain) return;
    if (!isChainAdded) {
      setError(t('environment.chainNotAdded', { name: selectedChain.name }));
      return;
    }
    if (!form.selectedCreate2Factory) {
      setError(t('environment.error.selectFactory'));
      return;
    }

    setActiveStep('proxy');
    setError(undefined);
    setSuccess(undefined);

    try {
      const proxyAddress = await deployFungibleProxy({
        factoryAddress: form.selectedCreate2Factory as Address,
        rpcUrl: selectedChain.rpcUrl,
        implementation: selectedState.token.address as Address,
        salt: form.create2Salt,
      });

      if (!proxyAddress) {
        setError(t('environment.error.deployProxy'));
        return;
      }

      const newState = { ...selectedState };
      newState.fungibleProxy = {
        address: proxyAddress,
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
          <p className="text-sm flex-1">{error}</p>
          <button
            onClick={() => setError(undefined)}
            className="text-red-400 hover:text-red-600 flex-shrink-0"
            aria-label={t('common.close')}
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm flex-1">{success}</p>
          <button
            onClick={() => setSuccess(undefined)}
            className="text-green-400 hover:text-green-600 flex-shrink-0"
            aria-label={t('common.close')}
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

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

          {!isChainAdded && selectedChain && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-800">
                  {t('environment.chainNotAdded', { name: selectedChain.name })}
                </p>
                <button
                  onClick={() => { void handleAddChain(); }}
                  disabled={isAddingChain}
                  className="mt-1 text-sm font-medium text-amber-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingChain
                    ? t('environment.addingChain')
                    : t('environment.addChainToWallet')}
                </button>
                {addChainError && (
                  <p className="mt-1 text-xs text-red-600">{addChainError}</p>
                )}
              </div>
            </div>
          )}

          <TokenDeployment
            state={selectedState}
            onDeploy={() => { void handleDeployToken(); }}
            isLoading={activeStep === 'token' || isDeployingCreate2}
            explorer={explorer}
            chainAdded={isChainAdded}
          />

          <FungibleProxyDeployment
            state={selectedState}
            create2Salt={form.create2Salt}
            setCreate2Salt={v => setForm({ ...form, create2Salt: v })}
            onDeploy={() => { void handleDeployProxy(); }}
            isLoading={activeStep === 'proxy' || isDeployingProxy}
            explorer={explorer}
            factories={availableFactories}
            selectedFactory={form.selectedCreate2Factory}
            setSelectedFactory={v => setForm({ ...form, selectedCreate2Factory: v })}
          />

          <FungibleFactoryDeployment
            state={selectedState}
            onDeploy={() => { void handleDeployFactory(); }}
            isLoading={activeStep === 'factory'}
            explorer={explorer}
          />
        </div>
      )}
    </div>
  );
}
