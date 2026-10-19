import { useCallback, useState } from 'react';
import { useChainStore, type VestingSchedule, type VestingTranche } from '../../../core/ChainStore';
import { eventBus } from '../../../core/EventBus';
import {
  buildScheduleId,
  buildTranches,
  computeVestedAmount,
  dueTranches,
  releasableAmount,
  toNumber,
  validateVestingForm,
  type SourceOption,
  type ValidationIssue,
  type VestingFormState,
} from '../types';

export interface VestingActionResult {
  ok: boolean;
  messageKey?: string;
  params?: Record<string, string | number>;
  issues?: ValidationIssue[];
  scheduleId?: string;
}

interface UseVestingManagerReturn {
  createSchedule: (form: VestingFormState, source: SourceOption) => Promise<VestingActionResult>;
  releaseTokens: (scheduleId: string) => Promise<VestingActionResult>;
  cancelSchedule: (scheduleId: string) => Promise<VestingActionResult>;
  isCreating: boolean;
  pendingScheduleId: string | null;
}

export function useVestingManager(): UseVestingManagerReturn {
  const { selectedChain, updateChainVestingSchedules } = useChainStore();
  const [isCreating, setIsCreating] = useState(false);
  const [pendingScheduleId, setPendingScheduleId] = useState<string | null>(null);

  const createSchedule = useCallback(
    async (form: VestingFormState, source: SourceOption): Promise<VestingActionResult> => {
      if (!selectedChain) {
        return { ok: false, messageKey: 'tokenVesting.error.chainNotLoaded' };
      }
      if (!selectedChain.token?.address) {
        return { ok: false, messageKey: 'tokenVesting.error.noToken' };
      }

      const rawSupply = selectedChain.token.totalSupply ? Number(selectedChain.token.totalSupply) : undefined;
      const tokenSupply = rawSupply !== undefined && Number.isFinite(rawSupply) ? rawSupply : undefined;

      const issues = validateVestingForm(form, { tokenSupply });
      if (issues.length > 0) {
        return { ok: false, messageKey: 'tokenVesting.error.invalidForm', issues };
      }

      setIsCreating(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const now = Date.now();
        const totalAmount = toNumber(form.totalAmount);
        const schedule: VestingSchedule = {
          id: buildScheduleId(selectedChain.id, form.name, now),
          name: form.name.trim(),
          chainId: selectedChain.id,
          chainName: selectedChain.name,
          tokenAddress: selectedChain.token.address,
          tokenSymbol: selectedChain.token.symbol,
          beneficiary: form.beneficiary.trim(),
          totalAmount,
          releasedAmount: 0,
          startDate: form.startDate,
          cliffDays: toNumber(form.cliffDays),
          durationDays: toNumber(form.durationDays),
          cadence: form.cadence,
          offeringId: source.isManual ? undefined : source.key,
          offeringName: source.isManual ? undefined : source.name,
          tranches: buildTranches(
            totalAmount,
            form.startDate,
            toNumber(form.cliffDays),
            toNumber(form.durationDays),
            form.cadence,
          ),
          status: 'active',
          createdAt: now,
        };

        updateChainVestingSchedules(selectedChain.id, {
          ...(selectedChain.VestingSchedules ?? {}),
          [schedule.id]: schedule,
        });

        eventBus.emit('vesting:schedule-created', {
          chainId: schedule.chainId,
          chainName: schedule.chainName,
          scheduleId: schedule.id,
          name: schedule.name,
          beneficiary: schedule.beneficiary,
          totalAmount: schedule.totalAmount,
          cadence: schedule.cadence,
          offeringId: schedule.offeringId,
          timestamp: now,
        });

        return { ok: true, scheduleId: schedule.id };
      } catch {
        return { ok: false, messageKey: 'tokenVesting.error.createFailed' };
      } finally {
        setIsCreating(false);
      }
    },
    [selectedChain, updateChainVestingSchedules],
  );

  const releaseTokens = useCallback(
    async (scheduleId: string): Promise<VestingActionResult> => {
      if (!selectedChain) {
        return { ok: false, messageKey: 'tokenVesting.error.chainNotLoaded' };
      }
      const schedule = selectedChain.VestingSchedules?.[scheduleId];
      if (!schedule) {
        return { ok: false, messageKey: 'tokenVesting.error.scheduleNotFound' };
      }
      if (schedule.status !== 'active') {
        return { ok: false, messageKey: 'tokenVesting.error.notActive' };
      }

      const now = Date.now();
      const releasable = releasableAmount(schedule, now);
      if (releasable <= 0) {
        return { ok: false, messageKey: 'tokenVesting.error.nothingToRelease' };
      }

      setPendingScheduleId(scheduleId);
      try {
        await new Promise(resolve => setTimeout(resolve, 700));

        const due = dueTranches(schedule, now);
        const releasedIds = new Set(due.map(tranche => tranche.id));
        const tranches: VestingTranche[] = schedule.tranches.map(tranche =>
          releasedIds.has(tranche.id) ? { ...tranche, released: true, releasedAt: now } : tranche,
        );

        const vested = computeVestedAmount(schedule, now);
        const updated: VestingSchedule = {
          ...schedule,
          tranches,
          releasedAmount: Math.min(schedule.totalAmount, vested),
          status: vested >= schedule.totalAmount ? 'completed' : 'active',
        };

        updateChainVestingSchedules(selectedChain.id, {
          ...(selectedChain.VestingSchedules ?? {}),
          [scheduleId]: updated,
        });

        eventBus.emit('vesting:tokens-released', {
          chainId: schedule.chainId,
          chainName: schedule.chainName,
          scheduleId,
          name: schedule.name,
          beneficiary: schedule.beneficiary,
          amount: updated.releasedAmount - schedule.releasedAmount,
          releasedAmount: updated.releasedAmount,
          timestamp: now,
        });

        return { ok: true, scheduleId };
      } catch {
        return { ok: false, messageKey: 'tokenVesting.error.releaseFailed' };
      } finally {
        setPendingScheduleId(null);
      }
    },
    [selectedChain, updateChainVestingSchedules],
  );

  const cancelSchedule = useCallback(
    async (scheduleId: string): Promise<VestingActionResult> => {
      if (!selectedChain) {
        return { ok: false, messageKey: 'tokenVesting.error.chainNotLoaded' };
      }
      const schedule = selectedChain.VestingSchedules?.[scheduleId];
      if (!schedule) {
        return { ok: false, messageKey: 'tokenVesting.error.scheduleNotFound' };
      }

      setPendingScheduleId(scheduleId);
      try {
        await new Promise(resolve => setTimeout(resolve, 700));

        updateChainVestingSchedules(selectedChain.id, {
          ...(selectedChain.VestingSchedules ?? {}),
          [scheduleId]: { ...schedule, status: 'cancelled' },
        });

        eventBus.emit('vesting:schedule-cancelled', {
          chainId: schedule.chainId,
          chainName: schedule.chainName,
          scheduleId,
          name: schedule.name,
          releasedAmount: schedule.releasedAmount,
          timestamp: Date.now(),
        });

        return { ok: true, scheduleId };
      } catch {
        return { ok: false, messageKey: 'tokenVesting.error.cancelFailed' };
      } finally {
        setPendingScheduleId(null);
      }
    },
    [selectedChain, updateChainVestingSchedules],
  );

  return { createSchedule, releaseTokens, cancelSchedule, isCreating, pendingScheduleId };
}
