import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Network,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { NegotiationChainState, ExchangePair, formatUnits, totalUnits } from './types';
import { eventBus } from '../../core/EventBus';
import mockChains from '@data/chains';
import { useChainStore } from '../../core/ChainStore';

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
  const { t } = useTranslation();
  const [chainStates, setChainStates] = useState<NegotiationChainState[]>([]);
  const { selectedChainId, selectedChain, selectChain } = useChainStore();
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
    void selectChain(initial[0].chainId);
  }, [selectChain]);

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
      });

      setSuccess(t('tokenNegotiation.success.updated', { name: pair.exchangeName, units: formatUnits(newUnits), chain: selectedState.chainName }));
      setEditingExchange(null);
      setEditValue('');
    } catch {
      setError(t('tokenNegotiation.error.updateFailed'));
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
        <h1 className="text-3xl font-bold text-foreground">{t('tokenNegotiation.title')}</h1>
        <p className="text-muted mt-1">
          {t('tokenNegotiation.subtitle')}
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
              {t('tokenNegotiation.totalUnits')}
            </p>
            <p className="text-2xl font-bold text-foreground">{formatUnits(total)} {t('tokenNegotiation.unitGFT')}</p>
          </div>
          <div className="bg-surface rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
              {t('tokenNegotiation.activeChains')}
            </p>
            <p className="text-2xl font-bold text-foreground">{chainStates.length}</p>
          </div>
          <div className="bg-surface rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
              {t('tokenNegotiation.exchanges')}
            </p>
            <p className="text-2xl font-bold text-foreground">{selectedState.exchanges.length}</p>
          </div>
          <div className="bg-surface rounded-xl border border-gray-200 p-5 flex items-center justify-center">
            <button
              onClick={handleRefresh}
              className="p-2 text-muted hover:text-foreground hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={t('common.refresh')}
              title={t('common.refresh')}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <label className="block text-xs font-medium text-muted uppercase tracking-wide">
            {t('tokenNegotiation.selectChain')}
          </label>
        </div>
        <select
          value={selectedChainId}
          onChange={e => {
            void selectChain(Number(e.target.value));
            setSuccess(undefined);
            setError(undefined);
            setEditingExchange(null);
            setEditValue('');
          }}
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono text-sm"
          disabled={editingExchange !== null}
        >
          {mockChains.map(chain => (
            <option key={chain.id} value={chain.id}>
              {t('tokenNegotiation.chainOption', { name: chain.name, symbol: chain.symbol, id: chain.id })}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-surface rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <Network className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {t('tokenNegotiation.chainHeader', { name: selectedChain.name, id: selectedChain.id })}
            </h2>
            <p className="text-sm text-muted">
              {selectedChain.rpcUrl}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-sm font-medium text-muted">{t('tokenNegotiation.table.exchange')}</th>
                <th className="py-3 px-4 text-sm font-medium text-muted">{t('tokenNegotiation.table.unitsPaired')}</th>
                <th className="py-3 px-4 text-sm font-medium text-muted">{t('tokenNegotiation.table.action')}</th>
              </tr>
            </thead>
            <tbody>
              {selectedState.exchanges.map(pair => (
                <tr key={pair.exchangeId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-foreground font-medium">
                    {pair.exchangeName}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted">
                    {isEditing(pair) ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                          disabled={isSaving(pair)}
                        />
                        <span className="text-xs text-muted">{t('tokenNegotiation.unitGFT')}</span>
                      </div>
                    ) : (
                      formatUnits(pair.units)
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {isEditing(pair) ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { void handleSaveUnits(pair); }}
                          disabled={isSaving(pair)}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isSaving(pair) ? t('tokenNegotiation.saving') : t('common.save')}
                        </button>
                        <button
                          onClick={() => setEditingExchange(null)}
                          className="px-3 py-1.5 text-muted hover:text-foreground hover:bg-gray-100 rounded transition-colors text-xs"
                        >
                          {t('common.cancel')}
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
                        {t('tokenNegotiation.edit')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedState.exchanges.length === 0 && (
          <div className="py-8 text-center text-muted">
            {t('tokenNegotiation.noExchanges')}
          </div>
        )}
      </div>
    </div>
  );
}
