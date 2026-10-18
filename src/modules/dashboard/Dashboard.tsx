import { 
  Network, 
  DollarSign, 
  Users, 
  Activity,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ChainData, formatNumber, formatAddress } from './types';
import mockChains from '@data/chains';

function ChainCard({ chain }: { chain: ChainData }) {
  const { t } = useTranslation();
  const token = chain.token;
  const priceChange = token?.priceChange24h || 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 hover:border-blue-300 transition-colors">
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
        <div className="flex items-center gap-2">
          {chain.isActive ? (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <CheckCircle className="h-3 w-3" />
              {t('dashboard.active')}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium text-muted bg-gray-50 px-2 py-1 rounded-full">
              <XCircle className="h-3 w-3" />
              {t('dashboard.inactive')}
            </span>
          )}
        </div>
      </div>

      {token && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('dashboard.tokenAddress')}
              </p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-foreground flex-1 truncate">{formatAddress(token.address)}</code>
                <button className="p-1 text-muted hover:text-muted" aria-label={t('dashboard.copyAddress')}>
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('dashboard.decimals')}
              </p>
              <p className="text-lg font-semibold text-foreground">{token.decimals}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('dashboard.totalSupply')}
              </p>
              <p className="text-lg font-semibold text-foreground">{formatNumber(token.totalSupply)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('dashboard.holders')}
              </p>
              <p className="text-lg font-semibold text-foreground">{formatNumber(token.holders)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('dashboard.priceUsd')}
              </p>
              <p className="text-lg font-semibold text-foreground">${token.priceUsd?.toFixed(4) || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('dashboard.change24h')}
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
              {t('dashboard.viewOnExplorer')}
            </a>
            <a
              href={chain.blockExplorer}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              {t('dashboard.chainExplorer')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsOverview() {
  const { t } = useTranslation();
  const activeChains = mockChains.filter(c => c.isActive).length;
  const totalSupply = mockChains.reduce((sum, c) => sum + (parseFloat(c.token?.totalSupply || '0')), 0);
  const totalHolders = mockChains.reduce((sum, c) => sum + (c.token?.holders || 0), 0);
  const avgPrice = mockChains.reduce((sum, c) => sum + (c.token?.priceUsd || 0), 0) / mockChains.filter(c => c.token).length;

  const stats = [
    { label: t('dashboard.stats.activeChains'), value: activeChains, icon: Network, color: 'text-blue-600 bg-blue-50' },
    { label: t('dashboard.stats.totalSupply'), value: formatNumber(totalSupply), icon: Activity, color: 'text-purple-600 bg-purple-50' },
    { label: t('dashboard.stats.totalHolders'), value: formatNumber(totalHolders), icon: Users, color: 'text-green-600 bg-green-50' },
    { label: t('dashboard.stats.avgPriceUsd'), value: `$${avgPrice.toFixed(4)}`, icon: DollarSign, color: 'text-yellow-600 bg-yellow-50' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-surface rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-xl ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const { t } = useTranslation();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
        <p className="text-muted mt-1">{t('dashboard.subtitle')}</p>
      </div>

      <StatsOverview />

      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          {t('dashboard.chainDeployments')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockChains.map(chain => (
            <ChainCard key={chain.id} chain={chain} />
          ))}
        </div>
      </div>

    </div>
  );
}
