import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId } from 'wagmi';
import {
  Network,
  CheckCircle,
  ExternalLink,
  Copy,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import {
  ChainData,
  formatNumber,
  formatAddress,
  MASTER_CHAIN_ID,
} from './types';
import { eventBus } from '../../core/EventBus';
import mockChains from '@data/chains';

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
}: {
  chain: ChainData;
  statusBadge: React.ReactNode;
  masked: boolean;
}) {
  const { t } = useTranslation();
  const token = chain.token;
  const priceChange = token?.priceChange24h || 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 hover:border-blue-300 transition-colors h-full relative">
      {masked && (
        <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <p className="text-sm text-muted">{t('extensions.connectWallet')}</p>
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
                {t('extensions.tokenAddress')}
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
                {t('extensions.decimals')}
              </p>
              <p className="text-lg font-semibold text-foreground">{token.decimals}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('extensions.totalSupply')}
              </p>
              <p className="text-lg font-semibold text-foreground">{formatNumber(token.totalSupply)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('extensions.holders')}
              </p>
              <p className="text-lg font-semibold text-foreground">{formatNumber(token.holders)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('extensions.priceUsd')}
              </p>
              <p className="text-lg font-semibold text-foreground">${token.priceUsd?.toFixed(4) || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('extensions.change24h')}
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
              {t('extensions.viewOnExplorer')}
            </a>
            <a
              href={chain.blockExplorer}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              {t('extensions.chainExplorer')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export function Extensions() {
  const { t } = useTranslation();
  const { isConnected } = useAccount();
  const walletChainId = useChainId();
  const [chains, setChains] = useState<ChainData[]>(initialChains);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const [masterChainId, setMasterChainId] = useState<number>(MASTER_CHAIN_ID);
  const [selectedExtension, setSelectedExtension] = useState<string>('');

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
    if (!isConnected || !walletChainId) return;
    const chainId = Number(walletChainId);

    // Set master chain if connected chain is a master candidate (has token and isActive)
    const connectedChain = chains.find(c => c.id === chainId);
    if (connectedChain && connectedChain.isActive && connectedChain.token) {
      setMasterChainId(chainId);
    }
  }, [isConnected, walletChainId, chains]);

  useEffect(() => {
    const unsubscribe = eventBus.on('refresh-extensions', () => {
      setChains(mockChains.map(c => ({ ...c, token: c.token ? { ...c.token } : undefined })));
      setSuccess(undefined);
      setError(undefined);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('extensions.title')}</h1>
        <p className="text-muted mt-1">
          {t('extensions.subtitle')}
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
          <div className="lg:col-span-4">
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
              {t('extensions.masterChain')}
            </p>
            <div className="relative mb-3">
              {isConnected ? (
                <select
                  value={masterChainId}
                  onChange={e => setMasterChainId(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none appearance-none font-mono text-sm pr-8"
                  aria-label={t('extensions.masterToken')}
                >
                  {masterCandidates.map(chain => (
                    <option key={chain.id} value={chain.id}>
                      {t('extensions.masterOption', {
                        name: chain.name,
                        symbol: chain.symbol,
                        token: t('extensions.masterToken'),
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
                  aria-label={t('extensions.masterToken')}
                />
              )}
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted pointer-events-none" />
            </div>
            {masterChain ? (
              <ChainTokenCard
                chain={masterChain}
                masked={!isConnected}
                statusBadge={
                  <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    {t('extensions.masterBadge')}
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
                    {t('extensions.masterBadge')}
                  </span>
                }
              />
            )}
          </div>

          <div className="lg:col-span-8">
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
              {t('extensions.extensionSelect')}
            </p>
            <div className="relative mb-3">
              {isConnected ? (
                <select
                  value={selectedExtension || ''}
                  onChange={e => setSelectedExtension(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none appearance-none font-mono text-sm pr-8"
                  aria-label={t('extensions.extensionSelect')}
                >
                  <option value="">{t('extensions.extensionSelectPlaceholder')}</option>
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
                  aria-label={t('extensions.extensionSelect')}
                />
              )}
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted pointer-events-none" />
            </div>

            <div className="relative bg-gray-100/80 rounded-xl border border-gray-200 p-6 min-h-[380px]">
              {!isConnected && (
                <div className="absolute inset-x-0 bottom-0 top-[80px] bg-gray-100/80 backdrop-blur-sm rounded-b-xl flex items-center justify-center z-10 pointer-events-none">
                  <p className="text-sm text-muted">{t('extensions.connectWallet')}</p>
                </div>
              )}
              <div className="relative z-10 space-y-4">
                {selectedExtension && (
                  <div className="bg-surface rounded-lg border border-gray-200 p-4 mt-4">
                    <h4 className="font-medium text-foreground mb-2">{t('extensions.extensionDetails')}</h4>
                    <p className="text-sm text-muted">{t('extensions.extensionDescription')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
