import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, Landmark, Loader2, Network } from 'lucide-react';
import mockChains from '@data/chains';
import { useChainStore } from '../../core/ChainStore';
import { LendingForm } from './components/LendingForm';
import { LendingCard } from './components/LendingCard';
import { useLendingManager } from './hooks/useLendingManager';
import {
  computeOutstanding,
  createInitialForm,
  formatAmount,
  normalizeLenders,
  validateLendingForm,
  type LendingFormState,
  type ValidationIssue,
} from './types';

export function TokenLending() {
  const { t, i18n } = useTranslation();
  const { selectedChainId, selectedChain, selectChain } = useChainStore();
  const { createOffer, fundLoan, recordRepayment, closeOffer, isCreating, pendingOfferId } = useLendingManager();

  const [form, setForm] = useState<LendingFormState>(() => createInitialForm());
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [showIssues, setShowIssues] = useState(false);

  useEffect(() => {
    if (!selectedChainId && mockChains.length > 0) {
      void selectChain(mockChains[0].id);
    }
  }, [selectedChainId, selectChain]);

  const lenderOptions = useMemo(() => normalizeLenders(selectedChain), [selectedChain]);

  useEffect(() => {
    setForm(prev => {
      const stillValid = lenderOptions.some(option => option.key === prev.lenderKey);
      if (stillValid) return prev;
      return { ...prev, lenderKey: lenderOptions[0]?.key ?? '' };
    });
  }, [lenderOptions]);

  const tokenSupply = useMemo(() => {
    const raw = selectedChain?.token?.totalSupply ? Number(selectedChain.token.totalSupply) : undefined;
    return raw !== undefined && Number.isFinite(raw) ? raw : undefined;
  }, [selectedChain]);

  const issues: ValidationIssue[] = useMemo(
    () => validateLendingForm(form, { tokenSupply }),
    [form, tokenSupply],
  );

  const offers = useMemo(
    () => Object.values(selectedChain?.LendingOffers ?? {}).sort((a, b) => b.createdAt - a.createdAt),
    [selectedChain],
  );

  const handleChainChange = (chainId: number) => {
    void selectChain(chainId);
    setError(undefined);
    setSuccess(undefined);
    setShowIssues(false);
  };

  const handleCreate = async () => {
    setError(undefined);
    setSuccess(undefined);

    if (issues.length > 0) {
      setShowIssues(true);
      setError(t('tokenLending.error.invalidForm'));
      return;
    }

    const lender = lenderOptions.find(option => option.key === form.lenderKey);
    if (!lender) {
      setError(t('tokenLending.error.invalidForm'));
      return;
    }

    const result = await createOffer(form, lender);
    if (!result.ok) {
      setError(result.messageKey ? t(result.messageKey, result.params) : t('tokenLending.error.createFailed'));
      return;
    }

    setForm(createInitialForm());
    setShowIssues(false);
    setSuccess(
      t('tokenLending.success.created', {
        name: form.name.trim(),
        chain: selectedChain?.name ?? '',
      }),
    );
  };

  const handleFund = async (offerId: string, borrower: string) => {
    setError(undefined);
    setSuccess(undefined);

    const result = await fundLoan(offerId, borrower);
    if (!result.ok) {
      setError(result.messageKey ? t(result.messageKey, result.params) : t('tokenLending.error.fundFailed'));
      return;
    }

    const offer = offers.find(item => item.id === offerId);
    setSuccess(
      t('tokenLending.success.funded', {
        amount: formatAmount(offer?.principal ?? 0),
        symbol: offer?.tokenSymbol ?? '',
        borrower,
      }),
    );
  };

  const handleRepay = async (offerId: string, amount: number) => {
    setError(undefined);
    setSuccess(undefined);

    const result = await recordRepayment(offerId, amount);
    if (!result.ok) {
      setError(
        result.messageKey ? t(result.messageKey, result.params) : t('tokenLending.error.repaymentFailed'),
      );
      return;
    }

    const offer = offers.find(item => item.id === offerId);
    setSuccess(
      t('tokenLending.success.repaid', {
        amount: formatAmount(amount),
        symbol: offer?.tokenSymbol ?? '',
      }),
    );
  };

  const handleClose = async (offerId: string) => {
    setError(undefined);
    setSuccess(undefined);

    const result = await closeOffer(offerId);
    if (!result.ok) {
      setError(result.messageKey ? t(result.messageKey, result.params) : t('tokenLending.error.closeFailed'));
      return;
    }

    const offer = offers.find(item => item.id === offerId);
    setSuccess(t('tokenLending.success.closed', { name: offer?.name ?? '' }));
  };

  const totalLent = offers.reduce(
    (sum, offer) => sum + (offer.status === 'active' ? offer.principal : 0),
    0,
  );
  const totalOutstanding = offers.reduce(
    (sum, offer) => sum + (offer.status === 'active' ? computeOutstanding(offer) : 0),
    0,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Landmark className="h-8 w-8 text-amber-600" />
          {t('tokenLending.title')}
        </h1>
        <p className="text-muted mt-1">{t('tokenLending.subtitle')}</p>
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
          htmlFor="lending-chain"
          className="block text-xs font-medium text-muted uppercase tracking-wide mb-2"
        >
          {t('tokenLending.selectChain')}
        </label>
        <select
          id="lending-chain"
          value={selectedChainId}
          onChange={e => handleChainChange(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono text-sm"
          disabled={isCreating}
        >
          {mockChains.map(chain => (
            <option key={chain.id} value={chain.id}>
              {t('tokenLending.chainOption', {
                name: chain.name,
                symbol: chain.symbol,
                id: chain.id,
              })}
            </option>
          ))}
        </select>

        {selectedChain && (
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Network className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {t('tokenLending.chainHeader', { name: selectedChain.name, id: selectedChain.id })}
              </p>
              <p className="text-sm text-muted">
                {selectedChain.token
                  ? `${selectedChain.token.name} • ${selectedChain.token.symbol} • ${selectedChain.token.decimals} ${t('tokenLending.decimals')}`
                  : t('tokenLending.error.noToken')}
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
        <LendingForm
          form={form}
          onChange={setForm}
          lenderOptions={lenderOptions}
          issues={showIssues ? issues : []}
          tokenSymbol={selectedChain.token?.symbol ?? '—'}
          tokenAddress={selectedChain.token?.address ?? ''}
          isCreating={isCreating}
          onCreate={() => { void handleCreate(); }}
        />
      )}

      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Landmark className="h-5 w-5 text-amber-600" />
          {t('tokenLending.offers')}
        </h2>

        {offers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-surface rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('tokenLending.totalLent')}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatAmount(totalLent)} {selectedChain?.token?.symbol ?? ''}
              </p>
            </div>
            <div className="bg-surface rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('tokenLending.totalOutstanding')}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatAmount(totalOutstanding)} {selectedChain?.token?.symbol ?? ''}
              </p>
            </div>
          </div>
        )}

        {offers.length === 0 ? (
          <div className="bg-surface rounded-xl border border-gray-200 p-8 text-center text-muted">
            {t('tokenLending.noOffers')}
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map(offer => (
              <LendingCard
                key={offer.id}
                offer={offer}
                locale={i18n.language}
                explorer={selectedChain?.blockExplorer ?? ''}
                isPending={pendingOfferId === offer.id}
                onFund={(id, borrower) => { void handleFund(id, borrower); }}
                onRepay={(id, amount) => { void handleRepay(id, amount); }}
                onClose={id => { void handleClose(id); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
