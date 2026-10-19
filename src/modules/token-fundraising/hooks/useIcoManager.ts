import { useCallback, useState } from 'react';
import { useChainStore, type IcoOffering } from '../../../core/ChainStore';
import { eventBus } from '../../../core/EventBus';
import {
  buildOfferingId,
  parseTiers,
  toNumber,
  validateIcoForm,
  type IcoFormState,
  type PaymentTokenOption,
  type ValidationIssue,
} from '../types';

export interface IcoActionResult {
  ok: boolean;
  messageKey?: string;
  params?: Record<string, string | number>;
  issues?: ValidationIssue[];
  offeringId?: string;
}

interface UseIcoManagerReturn {
  launchIco: (form: IcoFormState, payment: PaymentTokenOption) => Promise<IcoActionResult>;
  closeIco: (offeringId: string) => Promise<IcoActionResult>;
  recordContribution: (
    offeringId: string,
    investor: string,
    amount: number,
  ) => Promise<IcoActionResult>;
  isLaunching: boolean;
  pendingOfferingId: string | null;
}

export function useIcoManager(): UseIcoManagerReturn {
  const { selectedChain, updateChainICOs } = useChainStore();
  const [isLaunching, setIsLaunching] = useState(false);
  const [pendingOfferingId, setPendingOfferingId] = useState<string | null>(null);

  const launchIco = useCallback(
    async (form: IcoFormState, payment: PaymentTokenOption): Promise<IcoActionResult> => {
      if (!selectedChain) {
        return { ok: false, messageKey: 'tokenFundraising.error.chainNotLoaded' };
      }
      if (!selectedChain.token?.address) {
        return { ok: false, messageKey: 'tokenFundraising.error.noToken' };
      }

      const rawSupply = selectedChain.token.totalSupply ? Number(selectedChain.token.totalSupply) : undefined;
      const tokenSupply = rawSupply !== undefined && Number.isFinite(rawSupply) ? rawSupply : undefined;

      const issues = validateIcoForm(form, { tokenSupply });
      if (issues.length > 0) {
        return { ok: false, messageKey: 'tokenFundraising.error.invalidForm', issues };
      }

      setIsLaunching(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1200));

        const now = Date.now();
        const offering: IcoOffering = {
          id: buildOfferingId(selectedChain.id, form.name, now),
          name: form.name.trim(),
          chainId: selectedChain.id,
          chainName: selectedChain.name,
          tokenAddress: selectedChain.token.address,
          tokenSymbol: selectedChain.token.symbol,
          paymentTokenSymbol: payment.symbol,
          paymentTokenAddress: payment.address,
          price: toNumber(form.price),
          hardCap: toNumber(form.hardCap),
          softCap: toNumber(form.softCap),
          minContribution: toNumber(form.minContribution),
          maxContribution: toNumber(form.maxContribution),
          startDate: form.startDate,
          endDate: form.endDate,
          tgeDate: form.tgeDate,
          tiers: parseTiers(form),
          raised: 0,
          sold: 0,
          contributors: 0,
          status: 'live',
          createdAt: now,
        };

        updateChainICOs(selectedChain.id, {
          ...(selectedChain.ICOs ?? {}),
          [offering.id]: offering,
        });

        eventBus.emit('fundraising:ico-launched', {
          chainId: offering.chainId,
          chainName: offering.chainName,
          offeringId: offering.id,
          name: offering.name,
          price: offering.price,
          hardCap: offering.hardCap,
          paymentToken: offering.paymentTokenSymbol,
          timestamp: now,
        });

        return { ok: true, offeringId: offering.id };
      } catch {
        return { ok: false, messageKey: 'tokenFundraising.error.launchFailed' };
      } finally {
        setIsLaunching(false);
      }
    },
    [selectedChain, updateChainICOs],
  );

  const closeIco = useCallback(
    async (offeringId: string): Promise<IcoActionResult> => {
      if (!selectedChain) {
        return { ok: false, messageKey: 'tokenFundraising.error.chainNotLoaded' };
      }
      const offering = selectedChain.ICOs?.[offeringId];
      if (!offering) {
        return { ok: false, messageKey: 'tokenFundraising.error.offeringNotFound' };
      }

      setPendingOfferingId(offeringId);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));

        updateChainICOs(selectedChain.id, {
          ...(selectedChain.ICOs ?? {}),
          [offeringId]: { ...offering, status: 'closed' },
        });

        eventBus.emit('fundraising:ico-closed', {
          chainId: offering.chainId,
          chainName: offering.chainName,
          offeringId,
          name: offering.name,
          raised: offering.raised,
          sold: offering.sold,
          contributors: offering.contributors,
          timestamp: Date.now(),
        });

        return { ok: true, offeringId };
      } catch {
        return { ok: false, messageKey: 'tokenFundraising.error.closeFailed' };
      } finally {
        setPendingOfferingId(null);
      }
    },
    [selectedChain, updateChainICOs],
  );

  const recordContribution = useCallback(
    async (offeringId: string, investor: string, amount: number): Promise<IcoActionResult> => {
      if (!selectedChain) {
        return { ok: false, messageKey: 'tokenFundraising.error.chainNotLoaded' };
      }
      const offering = selectedChain.ICOs?.[offeringId];
      if (!offering) {
        return { ok: false, messageKey: 'tokenFundraising.error.offeringNotFound' };
      }
      if (offering.status !== 'live') {
        return { ok: false, messageKey: 'tokenFundraising.error.notLive' };
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, messageKey: 'tokenFundraising.error.invalidAmount' };
      }
      if (amount < offering.minContribution) {
        return {
          ok: false,
          messageKey: 'tokenFundraising.error.belowMinContribution',
          params: { min: offering.minContribution, symbol: offering.paymentTokenSymbol },
        };
      }
      if (amount > offering.maxContribution) {
        return {
          ok: false,
          messageKey: 'tokenFundraising.error.aboveMaxContribution',
          params: { max: offering.maxContribution, symbol: offering.paymentTokenSymbol },
        };
      }

      const tokensBought = amount / offering.price;
      if (offering.sold + tokensBought > offering.hardCap) {
        return { ok: false, messageKey: 'tokenFundraising.error.capReached' };
      }

      setPendingOfferingId(offeringId);
      try {
        await new Promise(resolve => setTimeout(resolve, 600));

        const updated: IcoOffering = {
          ...offering,
          raised: offering.raised + amount,
          sold: offering.sold + tokensBought,
          contributors: offering.contributors + 1,
        };

        updateChainICOs(selectedChain.id, {
          ...(selectedChain.ICOs ?? {}),
          [offeringId]: updated,
        });

        eventBus.emit('fundraising:contribution', {
          chainId: offering.chainId,
          chainName: offering.chainName,
          offeringId,
          name: offering.name,
          investor,
          amount,
          tokens: tokensBought,
          paymentToken: offering.paymentTokenSymbol,
          timestamp: Date.now(),
        });

        return { ok: true, offeringId };
      } catch {
        return { ok: false, messageKey: 'tokenFundraising.error.contributionFailed' };
      } finally {
        setPendingOfferingId(null);
      }
    },
    [selectedChain, updateChainICOs],
  );

  return { launchIco, closeIco, recordContribution, isLaunching, pendingOfferingId };
}
