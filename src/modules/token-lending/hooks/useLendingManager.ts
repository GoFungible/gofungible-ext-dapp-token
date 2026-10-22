import { useCallback, useState } from 'react';
import { useChainStore, type LendingOffer } from '../../chains/ChainStore';
import { eventBus } from '../../../core/EventBus';
import {
  buildOfferId,
  computeAccruedInterest,
  computeOutstanding,
  isValidAddress,
  toNumber,
  validateLendingForm,
  type LenderOption,
  type LendingFormState,
  type ValidationIssue,
} from '../types';

export interface LendingActionResult {
  ok: boolean;
  messageKey?: string;
  params?: Record<string, string | number>;
  issues?: ValidationIssue[];
  offerId?: string;
}

interface UseLendingManagerReturn {
  createOffer: (form: LendingFormState, lender: LenderOption) => Promise<LendingActionResult>;
  fundLoan: (offerId: string, borrower: string) => Promise<LendingActionResult>;
  recordRepayment: (offerId: string, amount: number) => Promise<LendingActionResult>;
  closeOffer: (offerId: string) => Promise<LendingActionResult>;
  isCreating: boolean;
  pendingOfferId: string | null;
}

export function useLendingManager(): UseLendingManagerReturn {
  const { selectedChain, updateChainLendingOffers } = useChainStore();
  const [isCreating, setIsCreating] = useState(false);
  const [pendingOfferId, setPendingOfferId] = useState<string | null>(null);

  const createOffer = useCallback(
    async (form: LendingFormState, lender: LenderOption): Promise<LendingActionResult> => {
      if (!selectedChain) {
        return { ok: false, messageKey: 'tokenLending.error.chainNotLoaded' };
      }
      if (!selectedChain.token?.address) {
        return { ok: false, messageKey: 'tokenLending.error.noToken' };
      }

      const rawSupply = selectedChain.token.totalSupply ? Number(selectedChain.token.totalSupply) : undefined;
      const tokenSupply = rawSupply !== undefined && Number.isFinite(rawSupply) ? rawSupply : undefined;

      const issues = validateLendingForm(form, { tokenSupply });
      if (issues.length > 0) {
        return { ok: false, messageKey: 'tokenLending.error.invalidForm', issues };
      }

      setIsCreating(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const now = Date.now();
        const offer: LendingOffer = {
          id: buildOfferId(selectedChain.id, form.name, now),
          name: form.name.trim(),
          chainId: selectedChain.id,
          chainName: selectedChain.name,
          tokenAddress: selectedChain.token.address,
          tokenSymbol: selectedChain.token.symbol,
          lender: lender.isIssuer ? 'issuer' : lender.name,
          lenderAddress: lender.address,
          borrower: form.borrower.trim(),
          principal: toNumber(form.principal),
          interestRate: toNumber(form.interestRate),
          termDays: toNumber(form.termDays),
          collateral: toNumber(form.collateral),
          accruedInterest: 0,
          repaid: 0,
          outstanding: toNumber(form.principal),
          status: 'open',
          createdAt: now,
        };

        updateChainLendingOffers(selectedChain.id, {
          ...(selectedChain.LendingOffers ?? {}),
          [offer.id]: offer,
        });

        eventBus.emit('lending:offer-created', {
          chainId: offer.chainId,
          chainName: offer.chainName,
          offerId: offer.id,
          name: offer.name,
          principal: offer.principal,
          interestRate: offer.interestRate,
          termDays: offer.termDays,
          timestamp: now,
        });

        return { ok: true, offerId: offer.id };
      } catch {
        return { ok: false, messageKey: 'tokenLending.error.createFailed' };
      } finally {
        setIsCreating(false);
      }
    },
    [selectedChain, updateChainLendingOffers],
  );

  const fundLoan = useCallback(
    async (offerId: string, borrower: string): Promise<LendingActionResult> => {
      if (!selectedChain) {
        return { ok: false, messageKey: 'tokenLending.error.chainNotLoaded' };
      }
      const offer = selectedChain.LendingOffers?.[offerId];
      if (!offer) {
        return { ok: false, messageKey: 'tokenLending.error.offerNotFound' };
      }
      if (offer.status !== 'open') {
        return { ok: false, messageKey: 'tokenLending.error.notOpen' };
      }
      if (!isValidAddress(borrower)) {
        return { ok: false, messageKey: 'tokenLending.error.borrowerAddressInvalid' };
      }

      setPendingOfferId(offerId);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));

        const now = Date.now();
        const updated: LendingOffer = {
          ...offer,
          borrower: borrower.trim(),
          status: 'active',
          fundedAt: now,
          outstanding: offer.principal,
        };

        updateChainLendingOffers(selectedChain.id, {
          ...(selectedChain.LendingOffers ?? {}),
          [offerId]: updated,
        });

        eventBus.emit('lending:loan-funded', {
          chainId: offer.chainId,
          chainName: offer.chainName,
          offerId,
          name: offer.name,
          borrower: updated.borrower,
          principal: offer.principal,
          timestamp: now,
        });

        return { ok: true, offerId };
      } catch {
        return { ok: false, messageKey: 'tokenLending.error.fundFailed' };
      } finally {
        setPendingOfferId(null);
      }
    },
    [selectedChain, updateChainLendingOffers],
  );

  const recordRepayment = useCallback(
    async (offerId: string, amount: number): Promise<LendingActionResult> => {
      if (!selectedChain) {
        return { ok: false, messageKey: 'tokenLending.error.chainNotLoaded' };
      }
      const offer = selectedChain.LendingOffers?.[offerId];
      if (!offer) {
        return { ok: false, messageKey: 'tokenLending.error.offerNotFound' };
      }
      if (offer.status !== 'active') {
        return { ok: false, messageKey: 'tokenLending.error.notActive' };
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, messageKey: 'tokenLending.error.invalidAmount' };
      }

      const now = Date.now();
      const outstanding = computeOutstanding(offer, now);
      if (amount > outstanding) {
        return {
          ok: false,
          messageKey: 'tokenLending.error.repaymentExceedsOutstanding',
          params: { outstanding: outstanding.toFixed(4), symbol: offer.tokenSymbol },
        };
      }

      setPendingOfferId(offerId);
      try {
        await new Promise(resolve => setTimeout(resolve, 600));

        const repaid = offer.repaid + amount;
        const accruedInterest = computeAccruedInterest(offer, now);
        const remaining = Math.max(0, outstanding - amount);
        const updated: LendingOffer = {
          ...offer,
          repaid,
          accruedInterest,
          outstanding: remaining,
          status: remaining <= 0 ? 'repaid' : 'active',
          repaidAt: remaining <= 0 ? now : offer.repaidAt,
        };

        updateChainLendingOffers(selectedChain.id, {
          ...(selectedChain.LendingOffers ?? {}),
          [offerId]: updated,
        });

        eventBus.emit('lending:repayment-recorded', {
          chainId: offer.chainId,
          chainName: offer.chainName,
          offerId,
          name: offer.name,
          amount,
          outstanding: remaining,
          status: updated.status,
          timestamp: now,
        });

        return { ok: true, offerId };
      } catch {
        return { ok: false, messageKey: 'tokenLending.error.repaymentFailed' };
      } finally {
        setPendingOfferId(null);
      }
    },
    [selectedChain, updateChainLendingOffers],
  );

  const closeOffer = useCallback(
    async (offerId: string): Promise<LendingActionResult> => {
      if (!selectedChain) {
        return { ok: false, messageKey: 'tokenLending.error.chainNotLoaded' };
      }
      const offer = selectedChain.LendingOffers?.[offerId];
      if (!offer) {
        return { ok: false, messageKey: 'tokenLending.error.offerNotFound' };
      }
      if (offer.status === 'active') {
        return { ok: false, messageKey: 'tokenLending.error.cannotCloseActive' };
      }

      setPendingOfferId(offerId);
      try {
        await new Promise(resolve => setTimeout(resolve, 700));

        updateChainLendingOffers(selectedChain.id, {
          ...(selectedChain.LendingOffers ?? {}),
          [offerId]: { ...offer, status: 'closed' },
        });

        eventBus.emit('lending:offer-closed', {
          chainId: offer.chainId,
          chainName: offer.chainName,
          offerId,
          name: offer.name,
          timestamp: Date.now(),
        });

        return { ok: true, offerId };
      } catch {
        return { ok: false, messageKey: 'tokenLending.error.closeFailed' };
      } finally {
        setPendingOfferId(null);
      }
    },
    [selectedChain, updateChainLendingOffers],
  );

  return { createOffer, fundLoan, recordRepayment, closeOffer, isCreating, pendingOfferId };
}
