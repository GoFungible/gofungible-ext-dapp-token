import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, Loader2, Lock, XCircle } from 'lucide-react';
import { computeProgress, formatAmount, formatDateTime, isValidAddress, type IcoOffering } from '../types';

interface IcoCardProps {
  offering: IcoOffering;
  locale: string;
  explorer: string;
  isPending: boolean;
  onClose: (offeringId: string) => void;
  onContribute: (offeringId: string, investor: string, amount: number) => void;
}

export function IcoCard({ offering, locale, explorer, isPending, onClose, onContribute }: IcoCardProps) {
  const { t } = useTranslation();
  const [showContribution, setShowContribution] = useState(false);
  const [investor, setInvestor] = useState('');
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState<string | undefined>();

  const progress = computeProgress(offering);
  const isLive = offering.status === 'live';

  const handleContribute = () => {
    setFormError(undefined);

    if (!isValidAddress(investor)) {
      setFormError(t('tokenFundraising.error.invalidAddress'));
      return;
    }

    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setFormError(t('tokenFundraising.error.invalidAmount'));
      return;
    }

    onContribute(offering.id, investor.trim(), parsed);
    setInvestor('');
    setAmount('');
    setShowContribution(false);
  };

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{offering.name}</h3>
          <p className="text-sm text-muted">
            {t('tokenFundraising.pricePerToken')}: {formatAmount(offering.price)} {offering.paymentTokenSymbol}
          </p>
        </div>
        {isLive ? (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <CheckCircle className="h-3 w-3" />
            {t('tokenFundraising.status.live')}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-muted bg-gray-100 px-2 py-1 rounded-full">
            <Lock className="h-3 w-3" />
            {t('tokenFundraising.status.closed')}
          </span>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-muted mb-1">
          <span>
            {t('tokenFundraising.sold')}: {formatAmount(offering.sold)} {offering.tokenSymbol}
          </span>
          <span>
            {t('tokenFundraising.hardCap')}: {formatAmount(offering.hardCap)} {offering.tokenSymbol}
          </span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenFundraising.raised')}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {formatAmount(offering.raised)} {offering.paymentTokenSymbol}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenFundraising.softCap')}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {formatAmount(offering.softCap)} {offering.tokenSymbol}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenFundraising.contributors')}
          </p>
          <p className="text-lg font-semibold text-foreground">{offering.contributors}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenFundraising.contributionLimits')}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {formatAmount(offering.minContribution)} — {formatAmount(offering.maxContribution)}{' '}
            {offering.paymentTokenSymbol}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenFundraising.saleStart')}
          </p>
          <p className="text-foreground">{formatDateTime(offering.startDate, locale)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenFundraising.saleEnd')}
          </p>
          <p className="text-foreground">{formatDateTime(offering.endDate, locale)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenFundraising.tgeDate')}
          </p>
          <p className="text-foreground">{formatDateTime(offering.tgeDate, locale)}</p>
        </div>
      </div>

      {offering.tiers.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 px-3 text-xs font-medium text-muted">{t('tokenFundraising.tierName')}</th>
                <th className="py-2 px-3 text-xs font-medium text-muted">{t('tokenFundraising.tierPrice')}</th>
                <th className="py-2 px-3 text-xs font-medium text-muted">{t('tokenFundraising.tierAllocation')}</th>
                <th className="py-2 px-3 text-xs font-medium text-muted">{t('tokenFundraising.tierMaxPerWallet')}</th>
              </tr>
            </thead>
            <tbody>
              {offering.tiers.map(tier => (
                <tr key={tier.name} className="border-b border-gray-100">
                  <td className="py-2 px-3 text-sm text-foreground font-medium">{tier.name}</td>
                  <td className="py-2 px-3 text-sm text-muted">
                    {formatAmount(tier.price)} {offering.paymentTokenSymbol}
                  </td>
                  <td className="py-2 px-3 text-sm text-muted">
                    {formatAmount(tier.allocation)} {offering.tokenSymbol}
                  </td>
                  <td className="py-2 px-3 text-sm text-muted">
                    {formatAmount(tier.maxPerWallet)} {offering.tokenSymbol}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showContribution && isLive && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={`investor-${offering.id}`}
                className="block text-xs font-medium text-muted uppercase tracking-wide mb-1"
              >
                {t('tokenFundraising.contributionInvestor')}
              </label>
              <input
                id={`investor-${offering.id}`}
                type="text"
                value={investor}
                onChange={e => setInvestor(e.target.value)}
                placeholder={t('common.addressPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono text-sm"
                disabled={isPending}
              />
            </div>
            <div>
              <label
                htmlFor={`amount-${offering.id}`}
                className="block text-xs font-medium text-muted uppercase tracking-wide mb-1"
              >
                {t('tokenFundraising.contributionAmount')} ({offering.paymentTokenSymbol})
              </label>
              <input
                id={`amount-${offering.id}`}
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm"
                disabled={isPending}
              />
            </div>
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
                setShowContribution(false);
                setFormError(undefined);
              }}
              disabled={isPending}
              className="px-3 py-1.5 text-foreground bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-xs disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleContribute}
              disabled={isPending}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium flex items-center gap-1 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {t('tokenFundraising.contribute')}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        {explorer ? (
          <a
            href={`${explorer}/address/${offering.tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {t('tokenFundraising.viewOnExplorer')}
          </a>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          {isLive && (
            <button
              type="button"
              onClick={() => setShowContribution(prev => !prev)}
              disabled={isPending}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium disabled:opacity-50"
            >
              {t('tokenFundraising.recordContribution')}
            </button>
          )}
          {isLive && (
            <button
              type="button"
              onClick={() => onClose(offering.id)}
              disabled={isPending}
              className="px-3 py-1.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-xs font-medium flex items-center gap-1 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              {t('tokenFundraising.closeIco')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
