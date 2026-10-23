import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import { useCreateFungibleToken } from './hooks/useCreateFungibleToken';
import { useFungibleTokens } from './hooks/useFungibleTokens';
import { useChainStore } from '../chains/ChainStore';
import {
  Network,
  CheckCircle,
  ExternalLink,
  Copy,
  Plus,
  Loader2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import {
  ChainData,
  formatNumber,
  formatAddress,
} from './types';
import { eventBus } from '../../core/EventBus';
import mockChains from '@data/chains';

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
  tokenOverride?: { name: string; symbol: string; address: string; decimals: number; totalSupply: string; holders: number };
}) {
  const { t } = useTranslation();
  const token = tokenOverride || chain.token;

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

export function TokenEcosystem() {
  const { t } = useTranslation();
  const { isConnected } = useAccount();
  const walletChainId = useChainId();
  const [chains, setChains] = useState<ChainData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const [masterChainId, setMasterChainId] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [createTokenOpen, setCreateTokenOpen] = useState(false);
  const [createTokenName, setCreateTokenName] = useState('');
  const [createTokenIsMaster, setCreateTokenIsMaster] = useState(false);
  const [createTokenSupply, setCreateTokenSupply] = useState('');
  const [selectedExtension, setSelectedExtension] = useState<string>('');
  const { data: walletClient } = useWalletClient();
  const { createFungibleToken } = useCreateFungibleToken();
  const { tokens: fungibleTokens, isLoading: isFetchingTokens, fetchTokens } = useFungibleTokens(masterChainId);

  const lastFetchedChainRef = useRef<number | null>(null);

  const masterChain = chains.find(c => c.id === masterChainId);
  const masterCandidates = chains.filter(c => c.isActive && c.token);

  const extensions = [
    { id: 'erc20', name: 'ERC20 Standard' },
    { id: 'erc721', name: 'ERC721 (NFT)' },
    { id: 'erc1155', name: 'ERC1155 (Multi-token)' },
    { id: 'permit', name: 'ERC2612 Permit' },
    { id: 'votes', name: 'ERC5805 Votes' },
    { id: 'flash-mint', name: 'ERC3156 Flash Mint' },
  ];

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

    // Set master chain if connected chain is a master candidate (has token and isActive)
    const connectedChain = mockChains.find(c => c.id === chainId);
    if (connectedChain && connectedChain.isActive && connectedChain.token) {
      setMasterChainId(chainId);
    }
  }, [isConnected, walletChainId]);

  // Fetch tokens when masterChainId changes to a valid master candidate
  useEffect(() => {
    if (!isConnected || !masterChainId) return;
    const chainConfig = mockChains.find(c => c.id === masterChainId);
    if (chainConfig && chainConfig.isActive && chainConfig.token && masterChainId !== lastFetchedChainRef.current) {
      lastFetchedChainRef.current = masterChainId;
      fetchTokens();
    }
  }, [isConnected, masterChainId, fetchTokens]);

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
        // Refresh tokens list after creation
        fetchTokens();
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
                  value={masterChainId || ''}
                  onChange={e => {
                    const newChainId = Number(e.target.value);
                    setMasterChainId(newChainId || null);
                    fetchTokens();
                  }}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none appearance-none font-mono text-sm pr-8"
                  disabled={isLoading}
                  aria-label={t('tokenEcosystem.masterToken')}
                >
                  <option value="">Select master chain...</option>
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
                  disabled={isLoading || isFetchingTokens}
                  aria-label={t('tokenEcosystem.tokenSelect')}
                >
                  <option value="">{isFetchingTokens ? t('tokenEcosystem.loadingTokens') : t('tokenEcosystem.tokenSelectPlaceholder')}</option>
                  {fungibleTokens.map(token => (
                    <option key={token.address || token.symbol} value={token.address || token.symbol}>
                      {token.name} ({token.symbol}){token.address ? ` • ${token.address.slice(0, 10)}...` : ''}
                    </option>
                  ))}
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

          <div className="lg:col-span-5">
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
              {t('tokenEcosystem.chain')}
            </p>
            <div className="relative mb-3">
              {isConnected ? (
                <select
                  value={selectedExtension || ''}
                  onChange={e => setSelectedExtension(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none appearance-none font-mono text-sm pr-8"
                  disabled={isLoading}
                  aria-label={t('tokenEcosystem.extensionSelect')}
                >
                  <option value="">{t('tokenEcosystem.extensionSelectPlaceholder')}</option>
                  {extensions.map(ext => (
                    <option key={ext.id} value={ext.id}>
                      {ext.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-gray-50 text-muted font-mono text-sm cursor-not-allowed"
                  disabled
                  placeholder=""
                  aria-label={t('tokenEcosystem.extensionSelect')}
                />
              )}
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted pointer-events-none" />
            </div>

            {selectedExtension && (
              <div className="bg-surface rounded-lg border border-gray-200 p-4 mt-4">
                <h4 className="font-medium text-foreground mb-2">{t('tokenEcosystem.extensionDetails')}</h4>
                <p className="text-sm text-muted">{t('tokenEcosystem.extensionDescription')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
