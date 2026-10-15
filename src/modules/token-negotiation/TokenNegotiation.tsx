import { useState, useEffect } from 'react';
import {
  Network,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { NegotiationChainState, ExchangePair, NegotiationEvent, formatUnits, totalUnits } from './types';
import { eventBus } from '../../core/EventBus';
import mockChains from '@data/chains.json';

const DEFAULT_EXCHANGES: Record<string, ExchangePair[]> = {
  '1': [
    { exchangeId: 'binance', exchangeName: 'Binance', units: 150000 },
    { exchangeId: 'coinbase', exchangeName: 'Coinbase', units: 80000 },
    { exchangeId: 'kraken', exchangeName: 'Kraken', units: 45000 },
  ],
  '137': [
    { exchangeId: 'binance', exchangeName: 'Binance', units: 120000 },
    { exchangeId: 'kucoin', exchangeName: 'KuCoin', units: 60000 },
    { exchangeId: 'mexc', exchangeName: 'MEXC', units: 30000 },
  ],
  '42161': [
    { exchangeId: 'binance', exchangeName: 'Binance', units: 90000 },
    { exchangeId: 'coinbase', exchangeName: 'Coinbase', units: 50000 },
    { exchangeId: 'uniswap', exchangeName: 'Uniswap', units: 25000 },
  ],
  '10': [
    { exchangeId: 'binance', exchangeName: 'Binance', units: 70000 },
    { exchangeId: 'coinbase', exchangeName: 'Coinbase', units: 40000 },
    { exchangeId: 'gate', exchangeName: 'Gate.io', units: 20000 },
  ],
  '8453': [
    { exchangeId: 'coinbase', exchangeName: 'Coinbase', units: 100000 },
    { exchangeId: 'binance', exchangeName: 'Binance', units: 80000 },
    { exchangeId: 'uniswap', exchangeName: 'Uniswap', units: 35000 },
  ],
};

export function TokenNegotiation() {
  const [chainStates, setChainStates] = useState<NegotiationChainState[]>([]);
  const [selectedChainId, setSelectedChainId] = useState<number>(0);
  const [editingExchange, setEditingExchange] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [savingExchange, setSavingExchange] = useState<string | null>(null);

  useEffect(() => {
    const initial: NegotiationChainState[] = mockChains.map(c => ({
      chainId: c.id,
      chainName: c.name,
      symbol: c.symbol,
      exchanges: DEFAULT_EXCHANGES[String(c.id)] || [],
    }));
    setChainStates(initial);
    setSelectedChainId(initial[0].chainId);
  }, []);

  useEffect(() => {
    const unsubscribe = eventBus.on('refresh-token-negotiation', () => {
      const refreshed = mockChains.map(c => ({
        chainId: c.id,
        chainName: c.name,
        symbol: c.symbol,
        exchanges: DEFAULT_EXCHANGES[String(c.id)] || [],
      }));
      setChainStates(refreshed);
    });
    return () => unsubscribe();
  }, []);

  const selectedState = chainStates.find(c => c.chainId === selectedChainId);
  const selectedChain = mockChains.find(c => c.id === selectedChainId);

  const isEditing = (pair: ExchangePair) => editingExchange === pair.exchangeId;
  const isSaving = (pair: ExchangePair) => savingExchange === pair.exchangeId;

  const handleSaveUnits = async (pair: ExchangePair) => {
    if (!selectedState) return;

    setSavingExchange(pair.exchangeId);
    setError(undefined);
    setSuccess(undefined);

    const newUnits = Number(editValue);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      setChainStates(prev =>
        prev.map(c => {
          if (c.chainId !== selectedChainId) return c;
          return {
            ...c,
            exchanges: c.exchanges.map(p =>
              p.exchangeId === pair.exchangeId ? { ...p, units: newUnits } : p
            ),
          };
        })
      );

      eventBus.emit('token-negotiation:set-units', {
        chainId: selectedChainId,
        chainName: selectedState.chainName,
        exchangeId: pair.exchangeId,
        exchangeName: pair.exchangeName,
        units: newUnits,
        action: 'set-units',
        timestamp: Date.now(),
      } as NegotiationEvent);

      setSuccess(`Updated ${pair.exchangeName} units to ${formatUnits(newUnits)} on ${selectedState.chainName}`);
      setEditingExchange(null);
      setEditValue('');
    } catch {
      setError('Failed to update units. Please try again.');
    } finally {
      setSavingExchange(null);
    }
  };

  const handleRefresh = () => {
    setError(undefined);
    setSuccess(undefined);
    setEditingExchange(null);
    setEditValue('');
    eventBus.emit('refresh-token-negotiation', undefined);
  };

  if (!selectedState || !selectedChain) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const total = totalUnits(chainStates);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Token Negotiation</h1>
        <p className="text-gray-500 mt-1">
          Manage the distribution of Multichain Token units across exchanges on each chain.
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Units</p>
            <p className="text-2xl font-bold text-gray-900">{formatUnits(total)} GFT</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Active Chains</p>
            <p className="text-2xl font-bold text-gray-900">{chainStates.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Exchanges</p>
            <p className="text-2xl font-bold text-gray-900">{selectedState.exchanges.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-center">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Refresh"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Select Chain
          </label>
        </div>
        <select
          value={selectedChainId}
          onChange={e => {
            setSelectedChainId(Number(e.target.value));
            setSuccess(undefined);
            setError(undefined);
            setEditingExchange(null);
            setEditValue('');
          }}
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono text-sm"
          disabled={editingExchange !== null}
        >
          {mockChains.map(chain => (
            <option key={chain.id} value={chain.id}>
              {chain.name} ({chain.symbol}) • Chain ID: {chain.id}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <Network className="h-6 w-6 text-green-600" />
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

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-sm font-medium text-gray-500">Exchange</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500">Units Paired</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {selectedState.exchanges.map(pair => (
                <tr key={pair.exchangeId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-700 font-medium">
                    {pair.exchangeName}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {isEditing(pair) ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                          disabled={isSaving(pair)}
                        />
                        <span className="text-xs text-gray-500">GFT</span>
                      </div>
                    ) : (
                      formatUnits(pair.units)
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {isEditing(pair) ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveUnits(pair)}
                          disabled={isSaving(pair)}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isSaving(pair) ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingExchange(null)}
                          className="px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingExchange(pair.exchangeId);
                          setEditValue(String(pair.units));
                        }}
                        className="px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors text-xs font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedState.exchanges.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No exchanges configured for this chain.
          </div>
        )}
      </div>
    </div>
  );
}
