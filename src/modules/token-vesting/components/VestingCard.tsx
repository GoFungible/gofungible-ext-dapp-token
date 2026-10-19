import { useTranslation } from 'react-i18next';
import { CheckCircle, Hourglass, Loader2, Lock, Send, XCircle } from 'lucide-react';
import {
  computeVestedAmount,
  computeVestingProgress,
  formatAmount,
  formatDateTime,
  nextReleaseDate,
  releasableAmount,
  type VestingSchedule,
} from '../types';

interface VestingCardProps {
  schedule: VestingSchedule;
  locale: string;
  explorer: string;
  isPending: boolean;
  onRelease: (scheduleId: string) => void;
  onCancel: (scheduleId: string) => void;
}

export function VestingCard({
  schedule,
  locale,
  explorer,
  isPending,
  onRelease,
  onCancel,
}: VestingCardProps) {
  const { t } = useTranslation();

  const vested = computeVestedAmount(schedule);
  const releasable = releasableAmount(schedule);
  const progress = computeVestingProgress(schedule);
  const next = nextReleaseDate(schedule);
  const isActive = schedule.status === 'active';

  const statusBadge = () => {
    if (schedule.status === 'completed') {
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
          <CheckCircle className="h-3 w-3" />
          {t('tokenVesting.status.completed')}
        </span>
      );
    }
    if (schedule.status === 'cancelled') {
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-muted bg-gray-100 px-2 py-1 rounded-full">
          <Lock className="h-3 w-3" />
          {t('tokenVesting.status.cancelled')}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
        <Hourglass className="h-3 w-3" />
        {t('tokenVesting.status.active')}
      </span>
    );
  };

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Hourglass className="h-5 w-5 text-indigo-600" />
            {schedule.name}
          </h3>
          <p className="text-sm text-muted">
            {t('tokenVesting.beneficiary')}:{' '}
            <span className="font-mono">
              {schedule.beneficiary.slice(0, 10)}...{schedule.beneficiary.slice(-8)}
            </span>
          </p>
          {schedule.offeringName && (
            <p className="text-sm text-muted">
              {t('tokenVesting.sourceOffering')}: {schedule.offeringName}
            </p>
          )}
        </div>
        {statusBadge()}
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-muted mb-1">
          <span>
            {t('tokenVesting.released')}: {formatAmount(schedule.releasedAmount)} {schedule.tokenSymbol}
          </span>
          <span>
            {t('tokenVesting.totalAmount')}: {formatAmount(schedule.totalAmount)} {schedule.tokenSymbol}
          </span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all"
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
            {t('tokenVesting.vested')}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {formatAmount(vested)} {schedule.tokenSymbol}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenVesting.releasable')}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {formatAmount(releasable)} {schedule.tokenSymbol}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenVesting.cliffDays')}
          </p>
          <p className="text-lg font-semibold text-foreground">{schedule.cliffDays}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenVesting.durationDays')}
          </p>
          <p className="text-lg font-semibold text-foreground">{schedule.durationDays}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenVesting.startDate')}
          </p>
          <p className="text-foreground">{formatDateTime(schedule.startDate, locale)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenVesting.cadence')}
          </p>
          <p className="text-foreground">
            {t(`tokenVesting.cadence.${schedule.cadence}`)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenVesting.nextRelease')}
          </p>
          <p className="text-foreground">
            {schedule.cadence === 'linear'
              ? t('tokenVesting.continuousRelease')
              : next
                ? formatDateTime(next, locale)
                : t('tokenVesting.noPendingRelease')}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        {explorer ? (
          <a
            href={`${explorer}/address/${schedule.tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {t('tokenVesting.viewOnExplorer')}
          </a>
        ) : (
          <span />
        )}

        {isActive && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onRelease(schedule.id)}
              disabled={isPending || releasable <= 0}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium flex items-center gap-1 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {t('tokenVesting.releaseTokens')}
            </button>
            <button
              type="button"
              onClick={() => onCancel(schedule.id)}
              disabled={isPending}
              className="px-3 py-1.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-xs font-medium flex items-center gap-1 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              {t('tokenVesting.cancelSchedule')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
