import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
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

const initialChains = mockChains.map(c => ({ ...c, token: c.token ? { ...c.token } : undefined }));

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
  tokenOverride,
}: {
  chain: ChainData;
  statusBadge: React.ReactNode;
  masked: boolean;
  tokenOverride?: { name: string; symbol: string; address: string; decimals: number; totalSupply: string; holders: number; priceUsd?: number; priceChange24h?: number };
}) {
  const { t } = useTranslation();
  const token = tokenOverride || chain.token;
  const priceChange = token?.priceChange24h || 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 hover:border-blue-300 transition-colors h-full relative">
      {masked && (
        <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <p className="text-sm text-muted">{t('tokenPerimeter.connectWallet')}</p>
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
                {t('tokenPerimeter.tokenAddress')}
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
                {t('tokenPerimeter.decimals')}
              </p>
              <p className="text-lg font-semibold text-foreground">{token.decimals}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('tokenPerimeter.totalSupply')}
              </p>
              <p className="text-lg font-semibold text-foreground">{formatNumber(token.totalSupply)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('tokenPerimeter.holders')}
              </p>
              <p className="text-lg font-semibold text-foreground">{formatNumber(token.holders)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('tokenPerimeter.priceUsd')}
              </p>
              <p className="text-lg font-semibold text-foreground">${token.priceUsd?.toFixed(4) || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('tokenPerimeter.change24h')}
              </p>
              <p className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </p>
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
              {t('tokenPerimeter.viewOnExplorer')}
            </a>
            <a
              href={chain.blockExplorer}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              {t('tokenPerimeter.chainExplorer')}
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
          {t('tokenPerimeter.bindChain', { name: chain.name })}
        </h3>
        <button
          onClick={onCancel}
          className="p-1.5 text-muted hover:text-muted hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={t('tokenPerimeter.cancelBind')}
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
            {t('tokenPerimeter.tokenContractAddress')}
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
              {t('tokenPerimeter.invalidAddress')}
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
              {t('tokenPerimeter.binding')}
            </>
          ) : (
            t('tokenPerimeter.confirmBind')
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
            {t('tokenPerimeter.unbindChain')}
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
              <p className="font-medium text-red-900">{t('tokenPerimeter.unbindWarning')}</p>
              <p className="text-sm text-red-700 mt-1">
                {t('tokenPerimeter.unbindDescription', { name: chain.name })}
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
                {t('tokenPerimeter.unbinding')}
              </>
            ) : (
              t('tokenPerimeter.confirmUnbind')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function DraggableSupportedChains({
  chains,
  selectedChainId,
  masked,
}: {
  chains: ChainData[];
  selectedChainId: number;
  masked: boolean;
}) {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const dragState = useRef({
    active: false,
    startX: 0,
    startOffset: 0,
    moved: false,
  });

  const ITEM_WIDTH = 160 + 16; // min-w + gap

  // Render the list 3 times so we can loop seamlessly in both directions.
  const loopItems = [...chains, ...chains, ...chains];

  const onPointerDown = (e: React.PointerEvent) => {
    dragState.current = { active: true, startX: e.clientX, startOffset: offset, moved: false };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.active) return;
    const dx = e.clientX - dragState.current.startX;
    if (Math.abs(dx) > 4) dragState.current.moved = true;
    const next = dragState.current.startOffset + dx;
    setOffset(next);
  };

  const commit = () => {
    dragState.current.active = false;
    const singleWidth = chains.length * ITEM_WIDTH;
    let next = offset;
    if (next > 0) next -= singleWidth;
    else if (next < -singleWidth) next += singleWidth;
    setOffset(next);
  };

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-4 lg:p-6">
      <h3 className="font-semibold text-foreground mb-4">
        {t('tokenPerimeter.supportedChains')} ({masked ? 0 : chains.length})
      </h3>
      {masked ? (
        <p className="text-sm text-muted">{t('tokenPerimeter.connectWallet')}</p>
      ) : chains.length === 0 ? (
        <p className="text-sm text-muted">{t('tokenPerimeter.noSupportedChains')}</p>
      ) : (
        <div
          ref={trackRef}
          className="overflow-x-auto cursor-grab active:cursor-grabbing select-none pb-2 -mx-2 px-2 lg:mx-0 lg:px-0 lg:pb-0 scrollbar-hide"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={commit}
          onPointerLeave={commit}
          onPointerCancel={commit}
        >
          <div
            className="flex flex-nowrap gap-4 min-w-max"
            style={{ transform: `translateX(${offset}px)` }}
          >
            {loopItems.map((chain, index) => (
              <div
                key={`${chain.id}-${index}`}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors min-w-[160px] ${
                  selectedChainId === chain.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Network className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground truncate">{chain.name}</p>
                  <p className="text-xs text-muted truncate">
                    {chain.token?.symbol} • {formatAddress(chain.token?.address || '')}
                  </p>
                </div>
                <span className="text-xs text-muted">
                  {formatNumber(chain.token?.totalSupply || '0')} {chain.token?.symbol}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TokenPerimeter() {
  const { t } = useTranslation();
  const { isConnected } = useAccount();
  const [chains, setChains] = useState<ChainData[]>(initialChains);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const [bindFormOpen, setBindFormOpen] = useState(false);
  const [bindTokenAddress, setBindTokenAddress] = useState('');
  const [unbindModalOpen, setUnbindModalOpen] = useState(false);
  const [chainToUnbind, setChainToUnbind] = useState<ChainData | null>(null);
  const [masterChainId, setMasterChainId] = useState<number | null>(null);
  const [selectedMasterToken, setSelectedMasterToken] = useState<string>('');
  const { selectedChainId: slaveChainId, selectedChain: slaveChain, selectChain: selectSlaveChain, chainCache } = useChainStore();

  const masterChain = chains.find(c => c.id === masterChainId);
  const masterCandidates = chains.filter(c => c.isActive && c.token);
  const selectableChains = chains.filter(c => c.id !== masterChainId);
  const slaveChainIsActive = slaveChain?.isActive ?? false;
  const canBind = !!slaveChain && !slaveChainIsActive;
  const canUnbind = !!slaveChain && slaveChainIsActive && slaveChain.id !== MASTER_CHAIN_ID;

  // Get selected master token data from cache
  const selectedMasterTokenData = selectedMasterToken && masterChainId
    ? (() => {
        const tokens = chainCache[masterChainId]?.FungibleTokens || {};
        const key = Object.keys(tokens).find(key =>
          tokens[key]?.address?.toLowerCase() === selectedMasterToken.toLowerCase() ||
          key.toLowerCase() === selectedMasterToken.toLowerCase()
        );
        return key ? { ...tokens[key], symbol: key } : null;
      })()
    : null;

  useEffect(() => {
    const unsubscribe = eventBus.on('refresh-token-perimeter', () => {
      setChains(mockChains.map(c => ({ ...c, token: c.token ? { ...c.token } : undefined })));
      setSuccess(undefined);
      setError(undefined);
    });

    return () => unsubscribe();
  }, []);


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

      eventBus.emit('perimeter:bind', {
        chainId: slaveChain.id,
        chainName: slaveChain.name,
        action: 'bind',
        timestamp: Date.now(),
      });

      setSuccess(t('tokenPerimeter.successBound', { name: slaveChain.name }));
      setBindFormOpen(false);
      setBindTokenAddress('');
    } catch {
      setError(t('tokenPerimeter.errorBindFailed'));
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

      eventBus.emit('perimeter:unbind', {
        chainId: chain.id,
        chainName: chain.name,
        action: 'unbind',
        timestamp: Date.now(),
      });

      setSuccess(t('tokenPerimeter.successUnbound', { name: chain.name }));
      setUnbindModalOpen(false);
      setChainToUnbind(null);
    } catch {
      setError(t('tokenPerimeter.errorUnbindFailed'));
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
        <h1 className="text-3xl font-bold text-foreground">{t('tokenPerimeter.title')}</h1>
        <p className="text-muted mt-1">
          {t('tokenPerimeter.subtitle')}
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
              {t('tokenPerimeter.masterChain')}
            </p>
            <div className="relative mb-3">
              {isConnected ? (
                <select
                  value={masterChainId || ''}
                  onChange={e => setMasterChainId(Number(e.target.value) || null)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none appearance-none font-mono text-sm pr-8"
                  disabled={isLoading}
                  aria-label={t('tokenPerimeter.masterToken')}
                >
                  <option value="">{t('tokenPerimeter.tokenSelectPlaceholder')}</option>
                  {masterCandidates.map(chain => (
                    <option key={chain.id} value={chain.id}>
                      {t('tokenPerimeter.masterOption', {
                        name: chain.name,
                        symbol: chain.symbol,
                        token: t('tokenPerimeter.masterToken'),
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
                  aria-label={t('tokenPerimeter.masterToken')}
                />
              )}
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted pointer-events-none" />
            </div>

            <div className="relative mb-3">
              {isConnected && masterChain ? (
                <select
                  value={selectedMasterToken}
                  onChange={e => setSelectedMasterToken(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none appearance-none font-mono text-sm pr-8"
                  disabled={isLoading}
                  aria-label={t('tokenPerimeter.masterTokenSelect')}
                >
                  <option value="">{t('tokenPerimeter.tokenSelectPlaceholder')}</option>
                  {(() => {
                    const tokens = masterChainId ? chainCache[masterChainId]?.FungibleTokens || {} : {};
                    return Object.entries(tokens).map(([symbol, token]: [string, { name: string; address: string }]) => (
                      <option key={token.address} value={token.address}>
                        {token.name} ({symbol}){token.address ? ` • ${token.address.slice(0, 10)}...` : ''}
                      </option>
                    ));
                  })()}
                </select>
              ) : (
                <input
                  type="text"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-gray-50 text-muted font-mono text-sm cursor-not-allowed"
                  disabled
                  placeholder=""
                  aria-label={t('tokenPerimeter.masterTokenSelect')}
                />
              )}
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted pointer-events-none" />
            </div>

            {masterChain ? (
              <ChainTokenCard
                chain={masterChain}
                masked={!isConnected}
                tokenOverride={selectedMasterTokenData ? {
                  name: selectedMasterTokenData.name,
                  symbol: selectedMasterTokenData.symbol || selectedMasterTokenData.name,
                  address: selectedMasterTokenData.address,
                  decimals: 18,
                  totalSupply: '0',
                  holders: 0
                } : undefined}
                statusBadge={
                  <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    {t('tokenPerimeter.masterBadge')}
                  </span>
                }
              />
            ) : (
              <ChainTokenCard
                chain={chains[0]}
                masked={true}
                statusBadge={
                  <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    {t('tokenPerimeter.masterBadge')}
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
                title={t('tokenPerimeter.titleBind')}
              >
                {isLoading && canBind ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {t('tokenPerimeter.bind')}
              </button>
              <button
                onClick={() => slaveChain && handleUnbindClick(slaveChain)}
                disabled={isLoading || !canUnbind || !isConnected}
                className="px-8 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                title={t('tokenPerimeter.titleUnbind')}
              >
                {isLoading && canUnbind ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {t('tokenPerimeter.unbind')}
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
              {t('tokenPerimeter.chain')}
            </p>
            <div className="relative mb-3">
              {isConnected ? (
                <select
                  value={slaveChainId || ''}
                  onChange={e => void selectSlaveChain(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none appearance-none font-mono text-sm pr-8"
                  disabled={isLoading}
                  aria-label={t('tokenPerimeter.chain')}
                >
                  <option value="">Select chain...</option>
                  {selectableChains.map(chain => (
                    <option key={chain.id} value={chain.id}>
                      {t('tokenPerimeter.chainOption', {
                        name: chain.name,
                        symbol: chain.symbol,
                        status: chain.isActive ? t('tokenPerimeter.bound') : t('tokenPerimeter.available'),
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
                  aria-label={t('tokenPerimeter.chain')}
                />
              )}
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted pointer-events-none" />
            </div>

            <div className="relative mb-3">
              {isConnected && slaveChain ? (
                <select
                  value={''}
                  onChange={() => {}}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none appearance-none font-mono text-sm pr-8"
                  disabled={isLoading}
                  aria-label={t('tokenPerimeter.tokenSelect')}
                >
                  <option value="">{t('tokenPerimeter.tokenSelectPlaceholder')}</option>
                  {(() => {
                    const tokens = chainCache[slaveChain.id]?.FungibleTokens || {};
                    return Object.entries(tokens).map(([symbol, token]) => (
                      <option key={token.address} value={token.address}>
                        {token.name} ({symbol}){token.address ? ` • ${token.address.slice(0, 10)}...` : ''}
                      </option>
                    ));
                  })()}
                </select>
              ) : (
                <input
                  type="text"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-gray-50 text-muted font-mono text-sm cursor-not-allowed"
                  disabled
                  placeholder=""
                  aria-label={t('tokenPerimeter.tokenSelect')}
                />
              )}
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted pointer-events-none" />
            </div>

            {slaveChain ? (
              <ChainTokenCard
                chain={slaveChain}
                masked={!isConnected}
                statusBadge={
                  slaveChainIsActive ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <CheckCircle className="h-3 w-3" />
                      {t('tokenPerimeter.active')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-muted bg-gray-50 px-2 py-1 rounded-full">
                      <XCircle className="h-3 w-3" />
                      {t('tokenPerimeter.available')}
                    </span>
                  )
                }
              />
            ) : (
              <ChainTokenCard
                chain={chains.find(c => c.id !== masterChainId) || chains[0]}
                masked={true}
                statusBadge={
                  <span className="flex items-center gap-1 text-xs font-medium text-muted bg-gray-50 px-2 py-1 rounded-full">
                    <XCircle className="h-3 w-3" />
                    {t('tokenPerimeter.available')}
                  </span>
                }
              />
            )}
          </div>
        </div>
      </div>

      <DraggableSupportedChains chains={chains.filter(c => c.isActive)} selectedChainId={slaveChainId} masked={!isConnected} />

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
