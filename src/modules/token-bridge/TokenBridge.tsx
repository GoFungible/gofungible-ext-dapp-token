import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import {
  ArrowRightLeft,
  ArrowDown,
  ArrowUp,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  ChevronDown,
  Network,
  DollarSign,
  ExternalLink,
} from 'lucide-react';
import {
  SUPPORTED_CHAINS,
  BridgeState,
  BridgeTransaction,
  formatNumber,
  formatAddress,
  formatAmount,
} from './types';

function ChainSelector({
  label,
  chain,
  onSelect,
  disabled,
  excludeChainId,
}: {
  label: string;
  chain: typeof SUPPORTED_CHAINS[0] | null;
  onSelect: (chain: typeof SUPPORTED_CHAINS[0]) => void;
  disabled?: boolean;
  excludeChainId?: number;
  isFromChain?: boolean;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const availableChains = SUPPORTED_CHAINS.filter(
    c => c.isActive && c.id !== excludeChainId
  );

  if (!chain) {
    return (
      <button
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-white hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Network className="h-5 w-5 text-gray-400" />
          </div>
          <span className="text-gray-500">{t('tokenBridge.selectChain', { label: label.toLowerCase() })}</span>
        </div>
        <ChevronDown className="h-5 w-5 text-gray-400" />
      </button>
    );
  }

  const token = chain.token;
  const balance = token ? formatAmount(BigInt(token.totalSupply), token.decimals) : '0';

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-white hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <Network className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{chain.name}</p>
            <p className="text-sm text-gray-500">{token?.symbol || 'GFT'} • {formatAddress(token?.address || '')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{parseFloat(balance).toFixed(4)} {token?.symbol}</span>
          <ChevronDown className={`h-5 w-5 text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{t('tokenBridge.selectChainModal', { label })}</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {availableChains.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelect(c);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Network className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{c.name}</p>
                    <p className="text-sm text-gray-500 truncate">{c.token?.symbol} • {formatAddress(c.token?.address || '')}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {c.token ? formatAmount(BigInt(c.token.totalSupply), c.token.decimals) : '0'} {c.token?.symbol}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AmountInput({
  chain,
  amount,
  onChange,
  maxAmount,
  onMax,
  error,
}: {
  chain: typeof SUPPORTED_CHAINS[0] | null;
  amount: string;
  onChange: (value: string) => void;
  maxAmount: string;
  onMax: () => void;
  error?: string;
}) {
  const { t } = useTranslation();
  const token = chain?.token;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      onChange(value);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{t('tokenBridge.amount')}</label>
      <div className="relative">
        <input
          type="text"
          value={amount}
          onChange={handleChange}
          placeholder={t('common.amountPlaceholder')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-right text-lg font-mono"
          disabled={!chain}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
          {token?.symbol || 'GFT'}
        </span>
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{t('tokenBridge.available', { max: maxAmount, symbol: token?.symbol || 'GFT' })}</span>
        <button
          type="button"
          onClick={onMax}
          disabled={!chain || parseFloat(amount) >= parseFloat(maxAmount)}
          className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('common.max')}
        </button>
      </div>
    </div>
  );
}

function TransactionHistory({ transactions }: { transactions: BridgeTransaction[] }) {
  const { t } = useTranslation();
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Send className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>{t('tokenBridge.noTransactions')}</p>
        <p className="text-sm mt-1">{t('tokenBridge.noTransactionsDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900">{t('tokenBridge.transactionHistory')}</h3>
      {transactions.slice().reverse().map(tx => (
        <div key={tx.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900">
              {t('tokenBridge.txRoute', { from: tx.fromChainId, to: tx.toChainId })}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              tx.status === 'completed' ? 'bg-green-100 text-green-700' :
              tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {t(`tokenBridge.status.${tx.status}`)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{t('tokenBridge.txAmount', { amount: formatAmount(BigInt(tx.amount), 18) })}</span>
            <span>{new Date(tx.timestamp).toLocaleString(i18n.language)}</span>
          </div>
          {tx.txHash && (
            <a
              href={`https://etherscan.io/tx/${tx.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="h-3 w-3" />
              {t('tokenBridge.viewTransaction')}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

export function TokenBridge() {
  const { t } = useTranslation();
  const [state, setState] = useState<BridgeState>({
    fromChain: SUPPORTED_CHAINS[0],
    toChain: SUPPORTED_CHAINS[1],
    amount: '',
    isLoading: false,
    error: undefined,
    success: undefined,
  });
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);

const fromToken = state.fromChain?.token;
  const fromDecimals = fromToken?.decimals || 18;
  const maxAmount = fromToken ? formatAmount(BigInt(fromToken.totalSupply), fromDecimals) : '0';

  const handleFromChainSelect = (chain: typeof SUPPORTED_CHAINS[0]) => {
    if (state.toChain && chain.id === state.toChain.id) {
      setState(prev => ({ ...prev, fromChain: chain, toChain: null, error: undefined }));
    } else {
      setState(prev => ({ ...prev, fromChain: chain, error: undefined }));
    }
  };

  const handleToChainSelect = (chain: typeof SUPPORTED_CHAINS[0]) => {
    if (state.fromChain && chain.id === state.fromChain.id) {
      setState(prev => ({ ...prev, toChain: chain, fromChain: null, error: undefined }));
    } else {
      setState(prev => ({ ...prev, toChain: chain, error: undefined }));
    }
  };

  const handleAmountChange = (value: string) => {
    setState(prev => ({ ...prev, amount: value, error: undefined, success: undefined }));
  };

  const handleMaxClick = () => {
    setState(prev => ({ ...prev, amount: maxAmount, error: undefined, success: undefined }));
  };

  const validateAmount = (amount: string): string | null => {
    if (!amount || parseFloat(amount) <= 0) {
      return t('tokenBridge.error.validAmount');
    }
    if (parseFloat(amount) > parseFloat(maxAmount)) {
      return t('tokenBridge.error.insufficientBalance', { max: maxAmount, symbol: fromToken?.symbol || 'GFT' });
    }
    return null;
  };

  const handleBridge = async () => {
    const error = validateAmount(state.amount);
    if (error) {
      setState(prev => ({ ...prev, error }));
      return;
    }

    if (!state.fromChain || !state.toChain) {
      setState(prev => ({ ...prev, error: t('tokenBridge.error.selectBothChains') }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: undefined, success: undefined }));

    await new Promise(resolve => setTimeout(resolve, 2000));

    const newTransaction: BridgeTransaction = {
      id: `tx_${Date.now()}`,
      fromChainId: state.fromChain.id,
      toChainId: state.toChain.id,
      fromAddress: '0x' + '0'.repeat(38) + '12',
      toAddress: '0x' + '0'.repeat(38) + '34',
      amount: state.amount,
      status: 'completed',
      timestamp: Date.now(),
      txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    };

    setTransactions(prev => [...prev, newTransaction]);
    setState(prev => ({
      ...prev,
      isLoading: false,
      amount: '',
      success: t('tokenBridge.success.bridged', {
        amount: state.amount,
        symbol: fromToken?.symbol || 'GFT',
        from: state.fromChain?.name,
        to: state.toChain?.name,
      }),
    }));
  };

  const handleSwapChains = () => {
    if (state.fromChain && state.toChain) {
      setState(prev => ({
        ...prev,
        fromChain: prev.toChain,
        toChain: prev.fromChain,
        amount: '',
        error: undefined,
        success: undefined,
      }));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tokenBridge.title')}</h1>
        <p className="text-gray-500 mt-1">{t('tokenBridge.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('tokenBridge.bridgeTransfer')}</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('tokenBridge.fromChain')}</label>
                <ChainSelector
                  label="From"
                  chain={state.fromChain}
                  onSelect={handleFromChainSelect}
                  excludeChainId={state.toChain?.id}
                />
              </div>

              <div className="flex justify-center my-2">
                <button
                  type="button"
                  onClick={handleSwapChains}
                  disabled={state.isLoading}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                  aria-label={t('tokenBridge.swapChains')}
                >
                  <ArrowRightLeft className="h-5 w-5" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('tokenBridge.toChain')}</label>
                <ChainSelector
                  label="To"
                  chain={state.toChain}
                  onSelect={handleToChainSelect}
                  excludeChainId={state.fromChain?.id}
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <AmountInput
                  chain={state.fromChain}
                  amount={state.amount}
                  onChange={handleAmountChange}
                  maxAmount={maxAmount}
                  onMax={handleMaxClick}
                  error={state.error}
                />
              </div>

              <button
                onClick={handleBridge}
                disabled={state.isLoading || !state.fromChain || !state.toChain || !state.amount}
                className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {state.isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t('common.processing')}
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    {t('tokenBridge.bridgeTokens')}
                  </>
                )}
              </button>

              {state.success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{state.success}</p>
                </div>
              )}

              {state.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{state.error}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <TransactionHistory transactions={transactions} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t('tokenBridge.bridgeInfo')}</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <ArrowDown className="h-5 w-5" />
                  <span className="font-medium">{t('tokenBridge.masterToSlave')}</span>
                </div>
                <p className="text-sm text-blue-700">{t('tokenBridge.masterToSlaveDesc')}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-purple-800 mb-2">
                  <ArrowUp className="h-5 w-5" />
                  <span className="font-medium">{t('tokenBridge.slaveToMaster')}</span>
                </div>
                <p className="text-sm text-purple-700">{t('tokenBridge.slaveToMasterDesc')}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-800 mb-2">
                  <DollarSign className="h-5 w-5" />
                  <span className="font-medium">{t('tokenBridge.oneToOneRatio')}</span>
                </div>
                <p className="text-sm text-gray-700">{t('tokenBridge.oneToOneRatioDesc')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t('tokenBridge.supportedChains')}</h3>
            <div className="space-y-3">
              {SUPPORTED_CHAINS.filter(c => c.isActive).map(chain => (
                <div
                  key={chain.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    state.fromChain?.id === chain.id || state.toChain?.id === chain.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <Network className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{chain.name}</p>
                    <p className="text-xs text-gray-500 truncate">{chain.token?.symbol} • {formatAddress(chain.token?.address || '')}</p>
                  </div>
                  <span className="text-xs text-gray-500">{formatNumber(chain.token?.totalSupply || '0')} {chain.token?.symbol}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
