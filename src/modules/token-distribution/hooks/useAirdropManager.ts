import { useCallback, useState } from 'react';
import { useChainStore, type AirdropCampaign, type AirdropRecipient } from '../../chains/ChainStore';
import { eventBus } from '../../../core/EventBus';
import {
  buildCampaignId,
  parseRecipients,
  toNumber,
  validateAirdropForm,
  type AirdropFormState,
  type ValidationIssue,
} from '../types';

export interface AirdropActionResult {
  ok: boolean;
  messageKey?: string;
  params?: Record<string, string | number>;
  issues?: ValidationIssue[];
  campaignId?: string;
}

interface UseAirdropManagerReturn {
  launchAirdrop: (form: AirdropFormState) => Promise<AirdropActionResult>;
  distributeTo: (campaignId: string, address: string, mode: 'sent' | 'claimed') => Promise<AirdropActionResult>;
  closeAirdrop: (campaignId: string) => Promise<AirdropActionResult>;
  isLaunching: boolean;
  pendingCampaignId: string | null;
}

export function useAirdropManager(): UseAirdropManagerReturn {
  const { selectedChain, updateChainAirdrops } = useChainStore();
  const [isLaunching, setIsLaunching] = useState(false);
  const [pendingCampaignId, setPendingCampaignId] = useState<string | null>(null);

  const launchAirdrop = useCallback(
    async (form: AirdropFormState): Promise<AirdropActionResult> => {
      if (!selectedChain) {
        return { ok: false, messageKey: 'tokenDistribution.error.chainNotLoaded' };
      }
      if (!selectedChain.token?.address) {
        return { ok: false, messageKey: 'tokenDistribution.error.noToken' };
      }

      const rawSupply = selectedChain.token.totalSupply ? Number(selectedChain.token.totalSupply) : undefined;
      const tokenSupply = rawSupply !== undefined && Number.isFinite(rawSupply) ? rawSupply : undefined;

      const issues = validateAirdropForm(form, { tokenSupply });
      if (issues.length > 0) {
        return { ok: false, messageKey: 'tokenDistribution.error.invalidForm', issues };
      }

      setIsLaunching(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1200));

        const now = Date.now();
        const campaign: AirdropCampaign = {
          id: buildCampaignId(selectedChain.id, form.name, now),
          name: form.name.trim(),
          chainId: selectedChain.id,
          chainName: selectedChain.name,
          tokenAddress: selectedChain.token.address,
          tokenSymbol: selectedChain.token.symbol,
          totalAmount: toNumber(form.totalAmount),
          distributed: 0,
          minBalance: toNumber(form.minBalance),
          claimMode: form.claimMode,
          deadline: form.deadline,
          recipients: parseRecipients(form),
          claims: 0,
          status: 'live',
          createdAt: now,
        };

        updateChainAirdrops(selectedChain.id, {
          ...(selectedChain.Airdrops ?? {}),
          [campaign.id]: campaign,
        });

        eventBus.emit('distribution:airdrop-launched', {
          chainId: campaign.chainId,
          chainName: campaign.chainName,
          campaignId: campaign.id,
          name: campaign.name,
          totalAmount: campaign.totalAmount,
          recipients: campaign.recipients.length,
          claimMode: campaign.claimMode,
          timestamp: now,
        });

        return { ok: true, campaignId: campaign.id };
      } catch {
        return { ok: false, messageKey: 'tokenDistribution.error.launchFailed' };
      } finally {
        setIsLaunching(false);
      }
    },
    [selectedChain, updateChainAirdrops],
  );

  const distributeTo = useCallback(
    async (
      campaignId: string,
      address: string,
      mode: 'sent' | 'claimed',
    ): Promise<AirdropActionResult> => {
      if (!selectedChain) {
        return { ok: false, messageKey: 'tokenDistribution.error.chainNotLoaded' };
      }
      const campaign = selectedChain.Airdrops?.[campaignId];
      if (!campaign) {
        return { ok: false, messageKey: 'tokenDistribution.error.campaignNotFound' };
      }
      if (campaign.status !== 'live') {
        return { ok: false, messageKey: 'tokenDistribution.error.notLive' };
      }

      const recipient = campaign.recipients.find(item => item.address.toLowerCase() === address.toLowerCase());
      if (!recipient) {
        return { ok: false, messageKey: 'tokenDistribution.error.recipientNotFound' };
      }
      if (recipient.status !== 'pending') {
        return { ok: false, messageKey: 'tokenDistribution.error.alreadyDistributed' };
      }
      if (campaign.distributed + recipient.amount > campaign.totalAmount) {
        return { ok: false, messageKey: 'tokenDistribution.error.totalExceeded' };
      }

      setPendingCampaignId(campaignId);
      try {
        await new Promise(resolve => setTimeout(resolve, 600));

        const updatedRecipients: AirdropRecipient[] = campaign.recipients.map(item =>
          item.address.toLowerCase() === address.toLowerCase() ? { ...item, status: mode } : item,
        );

        const updated: AirdropCampaign = {
          ...campaign,
          recipients: updatedRecipients,
          distributed: campaign.distributed + recipient.amount,
          claims: campaign.claims + (mode === 'claimed' ? 1 : 0),
        };

        updateChainAirdrops(selectedChain.id, {
          ...(selectedChain.Airdrops ?? {}),
          [campaignId]: updated,
        });

        eventBus.emit('distribution:airdrop-distributed', {
          chainId: campaign.chainId,
          chainName: campaign.chainName,
          campaignId,
          name: campaign.name,
          address: recipient.address,
          amount: recipient.amount,
          mode,
          timestamp: Date.now(),
        });

        return { ok: true, campaignId };
      } catch {
        return { ok: false, messageKey: 'tokenDistribution.error.distributeFailed' };
      } finally {
        setPendingCampaignId(null);
      }
    },
    [selectedChain, updateChainAirdrops],
  );

  const closeAirdrop = useCallback(
    async (campaignId: string): Promise<AirdropActionResult> => {
      if (!selectedChain) {
        return { ok: false, messageKey: 'tokenDistribution.error.chainNotLoaded' };
      }
      const campaign = selectedChain.Airdrops?.[campaignId];
      if (!campaign) {
        return { ok: false, messageKey: 'tokenDistribution.error.campaignNotFound' };
      }

      setPendingCampaignId(campaignId);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));

        updateChainAirdrops(selectedChain.id, {
          ...(selectedChain.Airdrops ?? {}),
          [campaignId]: { ...campaign, status: 'closed' },
        });

        eventBus.emit('distribution:airdrop-closed', {
          chainId: campaign.chainId,
          chainName: campaign.chainName,
          campaignId,
          name: campaign.name,
          distributed: campaign.distributed,
          totalAmount: campaign.totalAmount,
          timestamp: Date.now(),
        });

        return { ok: true, campaignId };
      } catch {
        return { ok: false, messageKey: 'tokenDistribution.error.closeFailed' };
      } finally {
        setPendingCampaignId(null);
      }
    },
    [selectedChain, updateChainAirdrops],
  );

  return { launchAirdrop, distributeTo, closeAirdrop, isLaunching, pendingCampaignId };
}
