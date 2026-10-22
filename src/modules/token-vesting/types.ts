import type {
  IcoOffering,
  VestingCadence,
  VestingSchedule,
  VestingScheduleStatus,
  VestingTranche,
} from '../chains/ChainStore';

export type { VestingCadence, VestingSchedule, VestingScheduleStatus, VestingTranche };

export const MANUAL_SOURCE_KEY = 'manual';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface VestingFormState {
  name: string;
  beneficiary: string;
  sourceKey: string;
  totalAmount: string;
  startDate: string;
  cliffDays: string;
  durationDays: string;
  cadence: VestingCadence;
}

export interface SourceOption {
  key: string;
  name: string;
  amount: number;
  isManual: boolean;
}

export interface ValidationIssue {
  field: string;
  messageKey: string;
  params?: Record<string, string | number>;
}

export interface VestingValidationContext {
  tokenSupply?: number;
}

export function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isPositive(value: string): boolean {
  return toNumber(value) > 0;
}

export function formatAmount(value: number, maxDecimals = 4): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString(undefined, { maximumFractionDigits: maxDecimals });
}

export function formatDateTime(value: string | number | undefined, locale?: string): string {
  if (value === undefined || value === '') return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function isValidAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

export function buildScheduleId(chainId: number, name: string, timestamp: number): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'vesting';
  return `${chainId}-${slug}-${timestamp.toString(36)}`;
}

export function createInitialForm(): VestingFormState {
  const now = Date.now();
  return {
    name: '',
    beneficiary: '',
    sourceKey: MANUAL_SOURCE_KEY,
    totalAmount: '',
    startDate: toLocalInputValue(new Date(now + DAY_MS)),
    cliffDays: '0',
    durationDays: '90',
    cadence: 'monthly',
  };
}

export function buildSourceOptions(offerings: IcoOffering[]): SourceOption[] {
  const options: SourceOption[] = [
    { key: MANUAL_SOURCE_KEY, name: 'manual', amount: 0, isManual: true },
  ];
  offerings.forEach(offering => {
    options.push({
      key: offering.id,
      name: offering.name,
      amount: offering.sold,
      isManual: false,
    });
  });
  return options;
}

export function validateVestingForm(
  form: VestingFormState,
  context: VestingValidationContext = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!form.name.trim()) {
    issues.push({ field: 'name', messageKey: 'tokenVesting.validation.nameRequired' });
  }
  if (!isValidAddress(form.beneficiary)) {
    issues.push({ field: 'beneficiary', messageKey: 'tokenVesting.validation.beneficiaryInvalid' });
  }

  const totalAmount = toNumber(form.totalAmount);
  if (!isPositive(form.totalAmount)) {
    issues.push({ field: 'totalAmount', messageKey: 'tokenVesting.validation.totalAmountRequired' });
  } else if (context.tokenSupply !== undefined && totalAmount > context.tokenSupply) {
    issues.push({
      field: 'totalAmount',
      messageKey: 'tokenVesting.validation.totalAmountExceedsSupply',
      params: { supply: formatAmount(context.tokenSupply) },
    });
  }

  const start = form.startDate ? new Date(form.startDate) : null;
  if (!start || Number.isNaN(start.getTime())) {
    issues.push({ field: 'startDate', messageKey: 'tokenVesting.validation.startRequired' });
  }

  const durationDays = toNumber(form.durationDays);
  const cliffDays = toNumber(form.cliffDays);
  if (!isPositive(form.durationDays)) {
    issues.push({ field: 'durationDays', messageKey: 'tokenVesting.validation.durationRequired' });
  }
  if (cliffDays < 0) {
    issues.push({ field: 'cliffDays', messageKey: 'tokenVesting.validation.cliffInvalid' });
  } else if (durationDays > 0 && cliffDays >= durationDays) {
    issues.push({ field: 'cliffDays', messageKey: 'tokenVesting.validation.cliffTooLong' });
  }

  return issues;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  next.setMonth(next.getMonth() + months);
  return next;
}

export function buildTranches(
  totalAmount: number,
  startDate: string,
  cliffDays: number,
  durationDays: number,
  cadence: VestingCadence,
): VestingTranche[] {
  if (cadence === 'linear') return [];

  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return [];

  const cliffDate = new Date(start.getTime() + cliffDays * DAY_MS);
  const endDate = new Date(start.getTime() + durationDays * DAY_MS);

  const dates: Date[] = [];
  if (cadence === 'daily') {
    for (let time = cliffDate.getTime(); time <= endDate.getTime(); time += DAY_MS) {
      dates.push(new Date(time));
    }
  } else if (cadence === 'weekly') {
    for (let time = cliffDate.getTime(); time <= endDate.getTime(); time += 7 * DAY_MS) {
      dates.push(new Date(time));
    }
  } else {
    let cursor = new Date(cliffDate.getTime());
    while (cursor.getTime() <= endDate.getTime()) {
      dates.push(new Date(cursor.getTime()));
      cursor = addMonths(cursor, 1);
    }
  }

  if (dates.length === 0) return [];

  const perTranche = totalAmount / dates.length;
  return dates.map((date, index) => ({
    id: `tranche-${index}-${date.getTime().toString(36)}`,
    date: date.toISOString(),
    amount: perTranche,
    released: false,
  }));
}

export function computeVestedAmount(schedule: VestingSchedule, now = Date.now()): number {
  const total = schedule.totalAmount;
  if (total <= 0) return 0;

  const start = new Date(schedule.startDate).getTime();
  if (Number.isNaN(start)) return 0;

  const cliffDate = start + schedule.cliffDays * DAY_MS;
  const endDate = start + schedule.durationDays * DAY_MS;

  if (now < cliffDate) return 0;

  if (schedule.cadence === 'linear') {
    const span = Math.max(1, endDate - cliffDate);
    const ratio = Math.min(1, (now - cliffDate) / span);
    return total * ratio;
  }

  return schedule.tranches
    .filter(tranche => new Date(tranche.date).getTime() <= now)
    .reduce((sum, tranche) => sum + tranche.amount, 0);
}

export function releasableAmount(schedule: VestingSchedule, now = Date.now()): number {
  return Math.max(0, computeVestedAmount(schedule, now) - schedule.releasedAmount);
}

export function computeVestingProgress(schedule: VestingSchedule): number {
  if (schedule.totalAmount <= 0) return 0;
  return Math.min(100, (schedule.releasedAmount / schedule.totalAmount) * 100);
}

export function nextReleaseDate(schedule: VestingSchedule, now = Date.now()): string | undefined {
  if (schedule.cadence === 'linear') return undefined;
  const next = schedule.tranches.find(
    tranche => !tranche.released && new Date(tranche.date).getTime() > now,
  );
  return next?.date;
}

export function dueTranches(schedule: VestingSchedule, now = Date.now()): VestingTranche[] {
  return schedule.tranches.filter(
    tranche => !tranche.released && new Date(tranche.date).getTime() <= now,
  );
}
