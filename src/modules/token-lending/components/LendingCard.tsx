import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, Landmark, Loader2, Lock, Send, XCircle } from 'lucide-react';
import {
  computeAccruedInterest,
  computeOutstanding,
  computeRepaymentProgress,
  formatAmount,
  formatDateTime,
  isValidAddress,
  type LendingOffer,
} from '../types';

interface LendingCardProps {
  offer: LendingOffer;
  locale: string;
  explorer: string;
  isPending: boolean;
  onFund: (offerId: string, borrower: string) => void;
  onRepay: (offerId: string, amount: number) => void;
  onClose: (offerId: string) => void;
}

export function LendingCard({
  offer,
  locale,
  explorer,
  isPending,
  onFund,
  onRepay,
  onClose,
}: LendingCardProps) {
  const { t } = useTranslation();
  const [showFunding, setShowFunding] = useState(false);
  const [borrower, setBorrower] = useState(offer.borrower);
  const [repayment, setRepayment] = useState('');
  const [formError, setFormError] = useState<string | undefined>();

  const accrued = computeAccruedInterest(offer);
  const outstanding = computeOutstanding(offer);
  const progress = computeRepaymentProgress(offer);

  const handleFund = () => {
    setFormError(undefined);
    if (!isValidAddress(borrower)) {
      setFormError(t('tokenLending.error.borrowerAddressInvalid'));
      return;
    }
    onFund(offer.id, borrower.trim());
    setShowFunding(false);
  };

  const handleRepay = () => {
    setFormError(undefined);
    const parsed = Number(repayment);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setFormError(t('tokenLending.error.invalidAmount'));
      return;
    }
    onRepay(offer.id, parsed);
    setRepayment('');
  };

  const statusBadge = () => {
    switch (offer.status) {
      case 'open':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            <Send className="h-3 w-3" />
            {t('tokenLending.status.open')}
          </span>
        );
      case 'active':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            <Landmark className="h-3 w-3" />
            {t('tokenLending.status.active')}
          </span>
        );
      case 'repaid':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <CheckCircle className="h-3 w-3" />
            {t('tokenLending.status.repaid')}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-muted bg-gray-100 px-2 py-1 rounded-full">
            <Lock className="h-3 w-3" />
            {t('tokenLending.status.closed')}
          </span>
        );
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{offer.name}</h3>
          <p className="text-sm text-muted">
            {t('tokenLending.lender')}: {offer.lender} • {t('tokenLending.rate')}: {offer.interestRate}% •{' '}
            {t('tokenLending.term')}: {offer.termDays} {t('tokenLending.days')}
          </p>
        </div>
        {statusBadge()}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenLending.principal')}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {formatAmount(offer.principal)} {offer.tokenSymbol}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenLending.outstanding')}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {formatAmount(outstanding)} {offer.tokenSymbol}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenLending.accruedInterest')}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {formatAmount(accrued)} {offer.tokenSymbol}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenLending.collateral')}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {formatAmount(offer.collateral)} {offer.tokenSymbol}
          </p>
        </div>
      </div>

      {offer.status === 'active' && (
        <div>
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span>
              {t('tokenLending.repaid')}: {formatAmount(offer.repaid)} {offer.tokenSymbol}
            </span>
            <span>
              {t('tokenLending.due')}: {formatAmount(outstanding)} {offer.tokenSymbol}
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-600 rounded-full transition-all"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenLending.borrower')}
          </p>
          <p className="font-mono text-foreground break-all">
            {offer.borrower ? `${offer.borrower.slice(0, 10)}...${offer.borrower.slice(-8)}` : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenLending.fundedAt')}
          </p>
          <p className="text-foreground">{formatDateTime(offer.fundedAt, locale)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenLending.createdAt')}
          </p>
          <p className="text-foreground">{formatDateTime(offer.createdAt, locale)}</p>
        </div>
      </div>

      {showFunding && offer.status === 'open' && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <label
              htmlFor={`borrower-${offer.id}`}
              className="block text-xs font-medium text-muted uppercase tracking-wide mb-1"
            >
              {t('tokenLending.borrower')}
            </label>
            <input
              id={`borrower-${offer.id}`}
              type="text"
              value={borrower}
              onChange={e => setBorrower(e.target.value)}
              placeholder={t('tokenLending.borrowerPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono text-sm"
              disabled={isPending}
            />
          </div>
          {formError && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowFunding(false);
                setFormError(undefined);
              }}
              disabled={isPending}
              className="px-3 py-1.5 text-foreground bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-xs disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleFund}
              disabled={isPending}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-xs font-medium flex items-center gap-1 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {t('tokenLending.fundLoan')}
            </button>
          </div>
        </div>
      )}

      {offer.status === 'active' && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <label
              htmlFor={`repayment-${offer.id}`}
              className="block text-xs font-medium text-muted uppercase tracking-wide mb-1"
            >
              {t('tokenLending.repaymentAmount')} ({offer.tokenSymbol})
            </label>
            <input
              id={`repayment-${offer.id}`}
              type="number"
              min="0"
              step="any"
              value={repayment}
              onChange={e => setRepayment(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm"
              disabled={isPending}
            />
          </div>
          {formError && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRepayment(String(outstanding))}
              disabled={isPending}
              className="px-3 py-1.5 text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors text-xs font-medium disabled:opacity-50"
            >
              {t('tokenLending.repayFull')}
            </button>
            <button
              type="button"
              onClick={handleRepay}
              disabled={isPending}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-xs font-medium flex items-center gap-1 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {t('tokenLending.recordRepayment')}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        {explorer ? (
          <a
            href={`${explorer}/address/${offer.tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {t('tokenLending.viewOnExplorer')}
          </a>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          {offer.status === 'open' && (
            <button
              type="button"
              onClick={() => setShowFunding(prev => !prev)}
              disabled={isPending}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-xs font-medium disabled:opacity-50"
            >
              {t('tokenLending.fundLoan')}
            </button>
          )}
          {offer.status !== 'active' && (
            <button
              type="button"
              onClick={() => onClose(offer.id)}
              disabled={isPending}
              className="px-3 py-1.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-xs font-medium flex items-center gap-1 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              {t('tokenLending.closeOffer')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
