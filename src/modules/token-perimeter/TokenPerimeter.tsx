import { 
  Network, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Activity,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy
} from 'lucide-react';
import { ChainData, formatNumber, formatAddress } from './types';
import mockChains from '@data/chains.json';

function ChainCard({ chain }: { chain: ChainData }) {
  const token = chain.token;
  const priceChange = token?.priceChange24h || 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            chain.isActive ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            <Network className={`h-6 w-6 ${chain.isActive ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{chain.name}</h3>
            <p className="text-sm text-gray-500">{chain.symbol} • Chain ID: {chain.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {chain.isActive ? (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <CheckCircle className="h-3 w-3" />
              Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
              <XCircle className="h-3 w-3" />
              Inactive
            </span>
          )}
        </div>
      </div>

      {token && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Token Address</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-gray-700 flex-1 truncate">{formatAddress(token.address)}</code>
                <button className="p-1 text-gray-400 hover:text-gray-600" aria-label="Copy address">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Decimals</p>
              <p className="text-lg font-semibold text-gray-900">{token.decimals}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Supply</p>
              <p className="text-lg font-semibold text-gray-900">{formatNumber(token.totalSupply)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Holders</p>
              <p className="text-lg font-semibold text-gray-900">{formatNumber(token.holders)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Price (USD)</p>
              <p className="text-lg font-semibold text-gray-900">${token.priceUsd?.toFixed(4) || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">24h Change</p>
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
              View on Explorer
            </a>
            <a
              href={chain.blockExplorer}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ExternalLink className="h-4 w-4" />
              Chain Explorer
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsOverview() {
  const activeChains = mockChains.filter(c => c.isActive).length;
  const totalSupply = mockChains.reduce((sum, c) => sum + (parseFloat(c.token?.totalSupply || '0')), 0);
  const totalHolders = mockChains.reduce((sum, c) => sum + (c.token?.holders || 0), 0);
  const avgPrice = mockChains.reduce((sum, c) => sum + (c.token?.priceUsd || 0), 0) / mockChains.filter(c => c.token).length;

  const stats = [
    { label: 'Active Chains', value: activeChains, icon: Network, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Supply', value: formatNumber(totalSupply), icon: Activity, color: 'text-purple-600 bg-purple-50' },
    { label: 'Total Holders', value: formatNumber(totalHolders), icon: Users, color: 'text-green-600 bg-green-50' },
    { label: 'Avg Price (USD)', value: `$${avgPrice.toFixed(4)}`, icon: DollarSign, color: 'text-yellow-600 bg-yellow-50' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
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

export function TokenPerimeter() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Token Perimeter</h1>
        <p className="text-gray-500 mt-1">Overview of multichain token deployment across EVM networks</p>
      </div>

      <StatsOverview />

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Chain Deployments
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockChains.map(chain => (
            <ChainCard key={chain.id} chain={chain} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          ERC-20 Features Overview
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Feature</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Ethereum</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Polygon</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Arbitrum</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Optimism</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Base</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm font-medium text-gray-700">Standard ERC-20</td>
                {mockChains.map(c => (
                  <td key={c.id} className="py-3 px-4 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm font-medium text-gray-700">Mintable</td>
                {mockChains.map(c => (
                  <td key={c.id} className="py-3 px-4 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm font-medium text-gray-700">Burnable</td>
                {mockChains.map(c => (
                  <td key={c.id} className="py-3 px-4 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm font-medium text-gray-700">Pausable</td>
                {mockChains.map((c, i) => (
                  <td key={c.id} className="py-3 px-4 text-sm text-gray-600">
                    {i < 3 ? (
                      <CheckCircle className="h-4 w-4 text-green-500 inline" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-300 inline" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm font-medium text-gray-700">Permit (EIP-2612)</td>
                {mockChains.map((c, i) => (
                  <td key={c.id} className="py-3 px-4 text-sm text-gray-600">
                    {i < 4 ? (
                      <CheckCircle className="h-4 w-4 text-green-500 inline" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-300 inline" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm font-medium text-gray-700">Votes (EIP-5805)</td>
                {mockChains.map((c, i) => (
                  <td key={c.id} className="py-3 px-4 text-sm text-gray-600">
                    {i === 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-500 inline" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-300 inline" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm font-medium text-gray-700">Flash Minting</td>
                {mockChains.map(() => (
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <XCircle className="h-4 w-4 text-gray-300 inline" />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 text-sm font-medium text-gray-700">Bridge Enabled</td>
                {mockChains.map((c, i) => (
                  <td key={c.id} className="py-3 px-4 text-sm text-gray-600">
                    {i < 4 ? (
                      <CheckCircle className="h-4 w-4 text-green-500 inline" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-300 inline" />
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}