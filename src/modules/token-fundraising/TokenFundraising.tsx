import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, Loader2, Network, Rocket } from 'lucide-react';
import mockChains from '@data/chains';
import { useChainStore } from '../../core/ChainStore';
import { IcoForm } from './components/IcoForm';
import { IcoCard } from './components/IcoCard';
import { useIcoManager } from './hooks/useIcoManager';
import {
  createInitialForm,
  formatAmount,
  normalizePaymentTokens,
  validateIcoForm,
  type IcoFormState,
  type ValidationIssue,
} from './types';

export function TokenFundraising() {
  const { t, i18n } = useTranslation();
  const { selectedChainId, selectedChain, selectChain } = useChainStore();
  const { launchIco, closeIco, recordContribution, isLaunching, pendingOfferingId } = useIcoManager();

  const [form, setForm] = useState<IcoFormState>(() => createInitialForm());
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [showIssues, setShowIssues] = useState(false);

  useEffect(() => {
    if (!selectedChainId && mockChains.length > 0) {
      void selectChain(mockChains[0].id);
    }
  }, [selectedChainId, selectChain]);

  const paymentOptions = useMemo(() => normalizePaymentTokens(selectedChain), [selectedChain]);

  useEffect(() => {
    setForm(prev => {
      const stillValid = paymentOptions.some(option => option.key === prev.paymentTokenKey);
      if (stillValid) return prev;
      return { ...prev, paymentTokenKey: paymentOptions[0]?.key ?? '' };
    });
  }, [paymentOptions]);

  const tokenSupply = useMemo(() => {
    const raw = selectedChain?.token?.totalSupply ? Number(selectedChain.token.totalSupply) : undefined;
    return raw !== undefined && Number.isFinite(raw) ? raw : undefined;
  }, [selectedChain]);

  const issues: ValidationIssue[] = useMemo(
    () => validateIcoForm(form, { tokenSupply }),
    [form, tokenSupply],
  );

  const offerings = useMemo(
    () => Object.values(selectedChain?.ICOs ?? {}).sort((a, b) => b.createdAt - a.createdAt),
    [selectedChain],
  );

  const handleChainChange = (chainId: number) => {
    void selectChain(chainId);
    setError(undefined);
    setSuccess(undefined);
    setShowIssues(false);
  };

  const handleLaunch = async () => {
    setError(undefined);
    setSuccess(undefined);

    if (issues.length > 0) {
      setShowIssues(true);
      setError(t('tokenFundraising.error.invalidForm'));
      return;
    }

    const payment = paymentOptions.find(option => option.key === form.paymentTokenKey);
    if (!payment) {
      setError(t('tokenFundraising.error.invalidForm'));
      return;
    }

    const result = await launchIco(form, payment);
    if (!result.ok) {
      setError(result.messageKey ? t(result.messageKey, result.params) : t('tokenFundraising.error.launchFailed'));
      return;
    }

    setForm(createInitialForm());
    setShowIssues(false);
    setSuccess(
      t('tokenFundraising.success.launched', {
        name: form.name.trim(),
        chain: selectedChain?.name ?? '',
      }),
    );
  };

  const handleClose = async (offeringId: string) => {
    setError(undefined);
    setSuccess(undefined);

    const result = await closeIco(offeringId);
    if (!result.ok) {
      setError(result.messageKey ? t(result.messageKey, result.params) : t('tokenFundraising.error.closeFailed'));
      return;
    }

    const offering = offerings.find(item => item.id === offeringId);
    setSuccess(t('tokenFundraising.success.closed', { name: offering?.name ?? '' }));
  };

  const handleContribution = async (offeringId: string, investor: string, amount: number) => {
    setError(undefined);
    setSuccess(undefined);

    const result = await recordContribution(offeringId, investor, amount);
    if (!result.ok) {
      setError(result.messageKey ? t(result.messageKey, result.params) : t('tokenFundraising.error.contributionFailed'));
      return;
    }

    const offering = offerings.find(item => item.id === offeringId);
    setSuccess(
      t('tokenFundraising.success.contribution', {
        amount: formatAmount(amount),
        symbol: offering?.paymentTokenSymbol ?? '',
        investor,
      }),
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Rocket className="h-8 w-8 text-blue-600" />
          {t('tokenFundraising.title')}
        </h1>
        <p className="text-muted mt-1">{t('tokenFundraising.subtitle')}</p>
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
        <label
          htmlFor="fundraising-chain"
          className="block text-xs font-medium text-muted uppercase tracking-wide mb-2"
        >
          {t('tokenFundraising.selectChain')}
        </label>
        <div className="relative">
          <select
            id="fundraising-chain"
            value={selectedChainId}
            onChange={e => handleChainChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono text-sm"
            disabled={isLaunching}
          >
            {mockChains.map(chain => (
              <option key={chain.id} value={chain.id}>
                {t('tokenFundraising.chainOption', {
                  name: chain.name,
                  symbol: chain.symbol,
                  id: chain.id,
                })}
              </option>
            ))}
          </select>
        </div>

        {selectedChain && (
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Network className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {t('tokenFundraising.chainHeader', { name: selectedChain.name, id: selectedChain.id })}
              </p>
              <p className="text-sm text-muted">
                {selectedChain.token
                  ? `${selectedChain.token.name} • ${selectedChain.token.symbol} • ${selectedChain.token.decimals} ${t('tokenFundraising.decimals')}`
                  : t('tokenFundraising.error.noToken')}
              </p>
            </div>
          </div>
        )}

        {!selectedChain && (
          <div className="mt-4 flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}
      </div>

      {selectedChain && (
        <IcoForm
          form={form}
          onChange={setForm}
          paymentOptions={paymentOptions}
          issues={showIssues ? issues : []}
          tokenSymbol={selectedChain.token?.symbol ?? '—'}
          tokenAddress={selectedChain.token?.address ?? ''}
          isLaunching={isLaunching}
          onLaunch={() => { void handleLaunch(); }}
        />
      )}

      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Rocket className="h-5 w-5 text-blue-600" />
          {t('tokenFundraising.offerings')}
        </h2>

        {offerings.length === 0 ? (
          <div className="bg-surface rounded-xl border border-gray-200 p-8 text-center text-muted">
            {t('tokenFundraising.noOfferings')}
          </div>
        ) : (
          <div className="space-y-4">
            {offerings.map(offering => (
              <IcoCard
                key={offering.id}
                offering={offering}
                locale={i18n.language}
                explorer={selectedChain?.blockExplorer ?? ''}
                isPending={pendingOfferingId === offering.id}
                onClose={id => { void handleClose(id); }}
                onContribute={(id, investor, amount) => { void handleContribution(id, investor, amount); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
