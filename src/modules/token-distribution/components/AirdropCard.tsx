import { useTranslation } from 'react-i18next';
import { CheckCircle, Gift, Loader2, Lock, Send, Users, XCircle } from 'lucide-react';
import {
  computeAirdropProgress,
  formatAmount,
  formatDateTime,
  pendingRecipients,
  type AirdropCampaign,
} from '../types';

interface AirdropCardProps {
  campaign: AirdropCampaign;
  locale: string;
  explorer: string;
  isPending: boolean;
  onDistribute: (campaignId: string, address: string, mode: 'sent' | 'claimed') => void;
  onClose: (campaignId: string) => void;
}

export function AirdropCard({
  campaign,
  locale,
  explorer,
  isPending,
  onDistribute,
  onClose,
}: AirdropCardProps) {
  const { t } = useTranslation();

  const progress = computeAirdropProgress(campaign);
  const isLive = campaign.status === 'live';
  const pending = pendingRecipients(campaign);

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-600" />
            {campaign.name}
          </h3>
          <p className="text-sm text-muted">
            {campaign.claimMode === 'claim'
              ? t('tokenDistribution.claimModeClaim')
              : t('tokenDistribution.claimModePush')}
          </p>
        </div>
        {isLive ? (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <CheckCircle className="h-3 w-3" />
            {t('tokenDistribution.status.live')}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-muted bg-gray-100 px-2 py-1 rounded-full">
            <Lock className="h-3 w-3" />
            {t('tokenDistribution.status.closed')}
          </span>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-muted mb-1">
          <span>
            {t('tokenDistribution.distributed')}: {formatAmount(campaign.distributed)} {campaign.tokenSymbol}
          </span>
          <span>
            {t('tokenDistribution.totalAmount')}: {formatAmount(campaign.totalAmount)} {campaign.tokenSymbol}
          </span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 rounded-full transition-all"
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
            {t('tokenDistribution.recipientsCount')}
          </p>
          <p className="text-lg font-semibold text-foreground">{campaign.recipients.length}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenDistribution.pendingRecipients')}
          </p>
          <p className="text-lg font-semibold text-foreground">{pending.length}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenDistribution.claims')}
          </p>
          <p className="text-lg font-semibold text-foreground">{campaign.claims}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenDistribution.eligibility')}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {t('tokenDistribution.minBalanceValue', {
              amount: formatAmount(campaign.minBalance),
              symbol: campaign.tokenSymbol,
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenDistribution.deadline')}
          </p>
          <p className="text-foreground">{formatDateTime(campaign.deadline, locale)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenDistribution.tokenAddress')}
          </p>
          <code className="text-xs font-mono text-muted break-all">{campaign.tokenAddress}</code>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2 flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {t('tokenDistribution.recipientList')}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 px-3 text-xs font-medium text-muted">
                  {t('tokenDistribution.recipientAddress')}
                </th>
                <th className="py-2 px-3 text-xs font-medium text-muted">
                  {t('tokenDistribution.recipientAmount')}
                </th>
                <th className="py-2 px-3 text-xs font-medium text-muted">
                  {t('tokenDistribution.recipientStatus')}
                </th>
                {isLive && (
                  <th className="py-2 px-3 text-xs font-medium text-muted">
                    {t('tokenDistribution.action')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {campaign.recipients.map(recipient => (
                <tr key={recipient.address} className="border-b border-gray-100">
                  <td className="py-2 px-3 text-sm font-mono text-foreground">
                    {recipient.address.slice(0, 10)}...{recipient.address.slice(-8)}
                  </td>
                  <td className="py-2 px-3 text-sm text-muted">
                    {formatAmount(recipient.amount)} {campaign.tokenSymbol}
                  </td>
                  <td className="py-2 px-3">
                    {recipient.status === 'pending' ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-muted bg-gray-50 px-2 py-1 rounded-full">
                        {t('tokenDistribution.recipientStatusPending')}
                      </span>
                    ) : recipient.status === 'sent' ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        <Send className="h-3 w-3" />
                        {t('tokenDistribution.recipientStatusSent')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        {t('tokenDistribution.recipientStatusClaimed')}
                      </span>
                    )}
                  </td>
                  {isLive && (
                    <td className="py-2 px-3">
                      {recipient.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() =>
                            onDistribute(
                              campaign.id,
                              recipient.address,
                              campaign.claimMode === 'claim' ? 'claimed' : 'sent',
                            )
                          }
                          disabled={isPending}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium disabled:opacity-50"
                        >
                          {isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            campaign.claimMode === 'claim'
                              ? t('tokenDistribution.recordClaim')
                              : t('tokenDistribution.markAsSent')
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        {explorer ? (
          <a
            href={`${explorer}/address/${campaign.tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {t('tokenDistribution.viewOnExplorer')}
          </a>
        ) : (
          <span />
        )}

        {isLive && (
          <button
            type="button"
            onClick={() => onClose(campaign.id)}
            disabled={isPending}
            className="px-3 py-1.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-xs font-medium flex items-center gap-1 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
            {t('tokenDistribution.closeAirdrop')}
          </button>
        )}
      </div>
    </div>
  );
}
