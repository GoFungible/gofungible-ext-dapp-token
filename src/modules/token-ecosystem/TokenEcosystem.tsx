import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import { useCreateFungibleToken } from './hooks/useCreateFungibleToken';
import {
  Network,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy,
  Plus,
  Trash2,
  Loader2,
  X,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import {
  ChainData,
  formatNumber,
  formatAddress,
  isEthereumAddress,
  MASTER_CHAIN_ID,
} from './types';
import { eventBus } from '../../core/EventBus';
import mockChains from '@data/chains';
import { useChainStore } from '../chains/ChainStore';

function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const handleCopy = () => {
    void navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 text-muted hover:text-muted"
      aria-label={copied ? t('common.copied') : t('dashboard.copyAddress')}
      title={copied ? t('common.copied') : t('dashboard.copyAddress')}
    >
      {copied ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

function ChainTokenCard({
  chain,
  statusBadge,
  masked,
}: {
  chain: ChainData;
  statusBadge: React.ReactNode;
  masked: boolean;
}) {
  const { t } = useTranslation();
  const token = chain.token;

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 hover:border-blue-300 transition-colors h-full relative">
      {masked && (
        <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <p className="text-sm text-muted">{t('tokenEcosystem.connectWallet')}</p>
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            chain.isActive ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            <Network className={`h-6 w-6 ${chain.isActive ? 'text-green-600' : 'text-muted'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{chain.name}</h3>
            <p className="text-sm text-muted">{chain.symbol} • Chain ID: {chain.id}</p>
          </div>
        </div>
        {statusBadge}
      </div>

      {token && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('tokenEcosystem.tokenAddress')}
              </p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-foreground flex-1 truncate">
                  {formatAddress(token.address)}
                </code>
                <CopyAddress address={token.address} />
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('tokenEcosystem.decimals')}
              </p>
              <p className="text-lg font-semibold text-foreground">{token.decimals}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('tokenEcosystem.totalSupply')}
              </p>
              <p className="text-lg font-semibold text-foreground">{formatNumber(token.totalSupply)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('tokenEcosystem.holders')}
              </p>
              <p className="text-lg font-semibold text-foreground">{formatNumber(token.holders)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <a
              href={`${chain.blockExplorer}/token/${token.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              {t('tokenEcosystem.viewOnExplorer')}
            </a>
            <a
              href={chain.blockExplorer}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              {t('tokenEcosystem.chainExplorer')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function BindForm({
  chain,
  tokenAddress,
  onTokenAddressChange,
  onConfirm,
  onCancel,
  isLoading,
}: {
  chain: ChainData;
  tokenAddress: string;
  onTokenAddressChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const isAddressValid = tokenAddress && isEthereumAddress(tokenAddress);

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-600" />
          {t('tokenEcosystem.bindChain', { name: chain.name })}
        </h3>
        <button
          onClick={onCancel}
          className="p-1.5 text-muted hover:text-muted hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={t('tokenEcosystem.cancelBind')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
            <Network className="h-5 w-5 text-muted" />
          </div>
          <div>
            <p className="font-medium text-foreground">{chain.name}</p>
            <p className="text-sm text-muted">
              {chain.symbol} • Chain ID: {chain.id}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenEcosystem.tokenContractAddress')}
          </label>
          <input
            type="text"
            value={tokenAddress}
            onChange={e => onTokenAddressChange(e.target.value)}
            placeholder={t('common.addressPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
            disabled={isLoading}
          />
          {!isAddressValid && tokenAddress && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {t('tokenEcosystem.invalidAddress')}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-foreground bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading || !isAddressValid}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('tokenEcosystem.binding')}
            </>
          ) : (
            t('tokenEcosystem.confirmBind')
          )}
        </button>
      </div>
    </div>
  );
}

function UnbindModal({
  isOpen,
  onClose,
  chain,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  chain: ChainData | null;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  if (!isOpen || !chain) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            {t('tokenEcosystem.unbindChain')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-muted hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">{t('tokenEcosystem.unbindWarning')}</p>
              <p className="text-sm text-red-700 mt-1">
                {t('tokenEcosystem.unbindDescription', { name: chain.name })}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-foreground bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('tokenEcosystem.unbinding')}
              </>
            ) : (
              t('tokenEcosystem.confirmUnbind')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TokenEcosystem() {
  const { t } = useTranslation();
  const { isConnected } = useAccount();
  const walletChainId = useChainId();
  const [chains, setChains] = useState<ChainData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const [bindFormOpen, setBindFormOpen] = useState(false);
  const [bindTokenAddress, setBindTokenAddress] = useState('');
  const [unbindModalOpen, setUnbindModalOpen] = useState(false);
  const [chainToUnbind, setChainToUnbind] = useState<ChainData | null>(null);
  const [masterChainId, setMasterChainId] = useState<number>(MASTER_CHAIN_ID);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [createTokenOpen, setCreateTokenOpen] = useState(false);
  const [createTokenName, setCreateTokenName] = useState('');
  const [createTokenIsMaster, setCreateTokenIsMaster] = useState(false);
  const [createTokenSupply, setCreateTokenSupply] = useState('');
  const { selectedChainId: slaveChainId, selectedChain: slaveChain, selectChain: selectSlaveChain } = useChainStore();
  const { data: walletClient } = useWalletClient();
  const { createFungibleToken } = useCreateFungibleToken();

  const masterChain = chains.find(c => c.id === masterChainId);
  const masterCandidates = chains.filter(c => c.isActive && c.token);
  const selectableChains = chains.filter(c => c.id !== masterChainId);
  const slaveChainIsActive = slaveChain?.isActive ?? false;
  const canBind = !!slaveChain && !slaveChainIsActive;
  const canUnbind = !!slaveChain && slaveChainIsActive && slaveChain.id !== MASTER_CHAIN_ID;

  useEffect(() => {
    if (!isConnected) {
      setChains([]);
      return;
    }
    setChains(mockChains.map(c => ({ ...c, token: c.token ? { ...c.token } : undefined })));
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected || !walletChainId) return;
    const chainId = Number(walletChainId);

    // Set slave chain if connected chain is a valid selectable chain (not master, has token)
    if (selectableChains.some(c => c.id === chainId)) {
      void selectSlaveChain(chainId);
    }
  }, [isConnected, walletChainId, selectSlaveChain, selectableChains]);

  useEffect(() => {
    const unsubscribe = eventBus.on('refresh-token-ecosystem', () => {
      setChains(mockChains.map(c => ({ ...c, token: c.token ? { ...c.token } : undefined })));
      setSuccess(undefined);
      setError(undefined);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedToken === 'create-new') {
      setCreateTokenOpen(true);
    }
  }, [selectedToken]);

  const handleCreateToken = async () => {
    if (!createTokenName.trim()) return;
    if (!masterChain) {
      setError(t('tokenEcosystem.noMasterChain'));
      return;
    }
    if (!walletClient) {
      setError(t('tokenEcosystem.walletNotConnected'));
      return;
    }

    setIsLoading(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const result = await createFungibleToken({
        name: createTokenName,
        supply: createTokenSupply,
        isMaster: createTokenIsMaster,
        masterChainId,
      });

      if (result.ok) {
        setSuccess(t('tokenEcosystem.tokenCreated', { name: createTokenName }));
        setCreateTokenOpen(false);
        setCreateTokenName('');
        setCreateTokenSupply('');
        setCreateTokenIsMaster(false);
        setSelectedToken('');
      } else {
        setError(result.error || t('tokenEcosystem.errorCreateFailed'));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('tokenEcosystem.errorCreateFailed');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTokenCancel = () => {
    setCreateTokenOpen(false);
    setCreateTokenName('');
    setCreateTokenSupply('');
    setCreateTokenIsMaster(false);
    setSelectedToken('');
  };


  const handleBindButtonClick = () => {
    if (!slaveChain) return;
    setBindTokenAddress(slaveChain.token?.address || '');
    setBindFormOpen(true);
  };

  const handleBind = async () => {
    if (!slaveChain) return;

    setIsLoading(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      setChains(prev => prev.map(c =>
        c.id === slaveChain.id
          ? {
              ...c,
              isActive: true,
              token: c.token
                ? { ...c.token, address: bindTokenAddress }
                : {
                    address: bindTokenAddress,
                    name: `${c.name} Token`,
                    symbol: c.symbol,
                    decimals: 18,
                    totalSupply: '0',
                    holders: 0,
                  },
            }
          : c
      ));

      eventBus.emit('ecosystem:bind', {
        chainId: slaveChain.id,
        chainName: slaveChain.name,
        action: 'bind',
        timestamp: Date.now(),
      });

      setSuccess(t('tokenEcosystem.successBound', { name: slaveChain.name }));
      setBindFormOpen(false);
      setBindTokenAddress('');
    } catch {
      setError(t('tokenEcosystem.errorBindFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnbind = async (chain: ChainData) => {
    setIsLoading(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      setChains(prev => prev.map(c =>
        c.id === chain.id ? { ...c, isActive: false } : c
      ));

      eventBus.emit('ecosystem:unbind', {
        chainId: chain.id,
        chainName: chain.name,
        action: 'unbind',
        timestamp: Date.now(),
      });

      setSuccess(t('tokenEcosystem.successUnbound', { name: chain.name }));
      setUnbindModalOpen(false);
      setChainToUnbind(null);
    } catch {
      setError(t('tokenEcosystem.errorUnbindFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnbindClick = (chain: ChainData) => {
    setChainToUnbind(chain);
    setUnbindModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('tokenEcosystem.title')}</h1>
        <p className="text-muted mt-1">
          {t('tokenEcosystem.subtitle')}
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5">
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
              {t('tokenEcosystem.masterChain')}
            </p>
            <div className="relative mb-3">
              {isConnected ? (
                <select
                  value={masterChainId}
                  onChange={e => setMasterChainId(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none appearance-none font-mono text-sm pr-8"
                  disabled={isLoading}
                  aria-label={t('tokenEcosystem.masterToken')}
                >
                  {masterCandidates.map(chain => (
                    <option key={chain.id} value={chain.id}>
                      {t('tokenEcosystem.masterOption', {
                        name: chain.name,
                        symbol: chain.symbol,
                        token: t('tokenEcosystem.masterToken'),
                      })}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-gray-50 text-muted font-mono text-sm cursor-not-allowed"
                  disabled
                  placeholder=""
                  aria-label={t('tokenEcosystem.masterToken')}
                />
              )}
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted pointer-events-none" />
            </div>
            <div className="relative mb-3">
              {isConnected ? (
                <select
                  value={selectedToken}
                  onChange={e => setSelectedToken(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none appearance-none font-mono text-sm pr-8"
                  disabled={isLoading}
                  aria-label={t('tokenEcosystem.tokenSelect')}
                >
                  <option value="">{t('tokenEcosystem.tokenSelectPlaceholder')}</option>
                  {masterChain?.token && (
                    <option key={masterChain.token.address} value={masterChain.token.address}>
                      {masterChain.token.name} ({masterChain.token.symbol})
                    </option>
                  )}
                  <option disabled value="" style={{ borderTop: '1px solid #e5e7eb', marginTop: '4px', paddingTop: '4px' }} />
                  <option key="create-new" value="create-new">
                    {t('tokenEcosystem.createNewToken')}
                  </option>
                </select>
              ) : (
                <input
                  type="text"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-gray-50 text-muted font-mono text-sm cursor-not-allowed"
                  disabled
                  placeholder=""
                  aria-label={t('tokenEcosystem.tokenSelect')}
                />
              )}
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted pointer-events-none" />
            </div>
            {createTokenOpen ? (
              <div className="bg-surface rounded-xl border border-blue-300 p-6 mt-4 animate-fade-in">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  {t('tokenEcosystem.createNewToken')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
                      {t('tokenEcosystem.tokenName')}
                    </label>
                    <input
                      type="text"
                      value={createTokenName}
                      onChange={e => setCreateTokenName(e.target.value)}
                      placeholder={t('tokenEcosystem.tokenNamePlaceholder')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="createTokenIsMaster"
                      checked={createTokenIsMaster}
                      onChange={e => setCreateTokenIsMaster(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="createTokenIsMaster" className="text-sm text-foreground">
                      {t('tokenEcosystem.isMasterToken')}
                    </label>
                  </div>
                  {createTokenIsMaster && (
                    <div>
                      <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
                        {t('tokenEcosystem.tokenSupply')}
                      </label>
                      <input
                        type="text"
                        value={createTokenSupply}
                        onChange={e => setCreateTokenSupply(e.target.value)}
                        placeholder={t('tokenEcosystem.tokenSupplyPlaceholder')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                      />
                    </div>
                  )}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleCreateTokenCancel}
                      className="px-4 py-2 text-foreground bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleCreateToken}
                      disabled={isLoading || !createTokenName.trim()}
                      className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('common.processing')}
                        </>
                      ) : (
                        t('common.create')
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : masterChain && (
              <ChainTokenCard
                chain={masterChain}
                masked={!isConnected}
                statusBadge={
                  <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    {t('tokenEcosystem.masterBadge')}
                  </span>
                }
              />
            )}
          </div>

          <div className="lg:col-span-2 flex items-center justify-center self-center">
            <div className="flex flex-col gap-3">
              <button
                onClick={handleBindButtonClick}
                disabled={isLoading || !canBind || !isConnected}
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                title={t('tokenEcosystem.titleBind')}
              >
                {isLoading && canBind ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {t('tokenEcosystem.bind')}
              </button>
              <button
                onClick={() => slaveChain && handleUnbindClick(slaveChain)}
                disabled={isLoading || !canUnbind || !isConnected}
                className="px-8 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                title={t('tokenEcosystem.titleUnbind')}
              >
                {isLoading && canUnbind ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {t('tokenEcosystem.unbind')}
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
              {t('tokenEcosystem.chain')}
            </p>
            <div className="relative mb-3">
              {isConnected ? (
                <select
                  value={slaveChainId || ''}
                  onChange={e => void selectSlaveChain(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none appearance-none font-mono text-sm pr-8"
                  disabled={isLoading}
                  aria-label={t('tokenEcosystem.chain')}
                >
                  <option value="">Select chain...</option>
                  {selectableChains.map(chain => (
                    <option key={chain.id} value={chain.id}>
                      {t('tokenEcosystem.chainOption', {
                        name: chain.name,
                        symbol: chain.symbol,
                        status: chain.isActive ? t('tokenEcosystem.bound') : t('tokenEcosystem.available'),
                      })}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-gray-50 text-muted font-mono text-sm cursor-not-allowed"
                  disabled
                  placeholder=""
                  aria-label={t('tokenEcosystem.chain')}
                />
              )}
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted pointer-events-none" />
            </div>

            {slaveChain && (
              <ChainTokenCard
                chain={slaveChain}
                masked={!isConnected}
                statusBadge={
                  slaveChainIsActive ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <CheckCircle className="h-3 w-3" />
                      {t('tokenEcosystem.active')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-muted bg-gray-50 px-2 py-1 rounded-full">
                      <XCircle className="h-3 w-3" />
                      {t('tokenEcosystem.available')}
                    </span>
                  )
                }
              />
            )}
          </div>
        </div>
      </div>

      {bindFormOpen && slaveChain && (
        <BindForm
          chain={slaveChain}
          tokenAddress={bindTokenAddress}
          onTokenAddressChange={setBindTokenAddress}
          onConfirm={() => { void handleBind(); }}
          onCancel={() => {
            setBindFormOpen(false);
            setBindTokenAddress('');
          }}
          isLoading={isLoading}
        />
      )}

      <UnbindModal
        isOpen={unbindModalOpen}
        onClose={() => {
          setUnbindModalOpen(false);
          setChainToUnbind(null);
        }}
        chain={chainToUnbind}
        onConfirm={() => { if (chainToUnbind) { void handleUnbind(chainToUnbind); } }}
        isLoading={isLoading}
      />
    </div>
  );
}
