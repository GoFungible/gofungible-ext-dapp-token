import type { ChainJson, Lender, LendingOffer, LendingOfferStatus } from '../chains/ChainStore';

export type { LendingOffer, LendingOfferStatus };

export const ISSUER_LENDER_KEY = 'issuer';

export interface LendingFormState {
  name: string;
  lenderKey: string;
  borrower: string;
  principal: string;
  interestRate: string;
  termDays: string;
  collateral: string;
}

export interface LenderOption {
  key: string;
  name: string;
  address: string;
  isIssuer: boolean;
}

export interface ValidationIssue {
  field: string;
  messageKey: string;
  params?: Record<string, string | number>;
}

export interface LendingValidationContext {
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

export function isValidAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

export function buildOfferId(chainId: number, name: string, timestamp: number): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'loan';
  return `${chainId}-${slug}-${timestamp.toString(36)}`;
}

export function createInitialForm(): LendingFormState {
  return {
    name: '',
    lenderKey: ISSUER_LENDER_KEY,
    borrower: '',
    principal: '',
    interestRate: '',
    termDays: '30',
    collateral: '0',
  };
}

export function normalizeLenders(chain: ChainJson | null): LenderOption[] {
  const options: LenderOption[] = [];
  if (!chain) return options;

  const entries = (chain.Lenders ?? {}) as unknown as Record<string, Lender | string>;

  Object.entries(entries).forEach(([key, value]) => {
    if (typeof value === 'string') {
      if (!value) return;
      options.push({ key, name: key, address: value, isIssuer: false });
      return;
    }
    if (value && typeof value === 'object') {
      const address = value.address ?? '';
      if (!address) return;
      options.push({ key, name: value.name || key, address, isIssuer: false });
    }
  });

  options.unshift({
    key: ISSUER_LENDER_KEY,
    name: 'issuer',
    address: '',
    isIssuer: true,
  });

  return options;
}

export function validateLendingForm(
  form: LendingFormState,
  context: LendingValidationContext = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!form.name.trim()) {
    issues.push({ field: 'name', messageKey: 'tokenLending.validation.nameRequired' });
  }
  if (!form.lenderKey) {
    issues.push({ field: 'lenderKey', messageKey: 'tokenLending.validation.lenderRequired' });
  }

  const principal = toNumber(form.principal);
  if (!isPositive(form.principal)) {
    issues.push({ field: 'principal', messageKey: 'tokenLending.validation.principalRequired' });
  } else if (context.tokenSupply !== undefined && principal > context.tokenSupply) {
    issues.push({
      field: 'principal',
      messageKey: 'tokenLending.validation.principalExceedsSupply',
      params: { supply: formatAmount(context.tokenSupply) },
    });
  }

  const interestRate = toNumber(form.interestRate);
  if (!isPositive(form.interestRate)) {
    issues.push({ field: 'interestRate', messageKey: 'tokenLending.validation.interestRateRequired' });
  } else if (interestRate > 100) {
    issues.push({ field: 'interestRate', messageKey: 'tokenLending.validation.interestRateTooHigh' });
  }

  if (!isPositive(form.termDays)) {
    issues.push({ field: 'termDays', messageKey: 'tokenLending.validation.termDaysRequired' });
  }

  if (toNumber(form.collateral) < 0) {
    issues.push({ field: 'collateral', messageKey: 'tokenLending.validation.collateralInvalid' });
  }

  if (form.borrower.trim().length > 0 && !isValidAddress(form.borrower)) {
    issues.push({ field: 'borrower', messageKey: 'tokenLending.validation.borrowerAddressInvalid' });
  }

  return issues;
}

export function computeAccruedInterest(offer: LendingOffer, now = Date.now()): number {
  if (!offer.fundedAt || offer.termDays <= 0) return 0;
  const elapsedDays = Math.max(0, (now - offer.fundedAt) / (24 * 60 * 60 * 1000));
  const factor = Math.min(1, elapsedDays / offer.termDays);
  return offer.principal * (offer.interestRate / 100) * factor;
}

export function computeOutstanding(offer: LendingOffer, now = Date.now()): number {
  return offer.principal + computeAccruedInterest(offer, now) - offer.repaid;
}

export function computeRepaymentProgress(offer: LendingOffer, now = Date.now()): number {
  const total = offer.principal + computeAccruedInterest(offer, now);
  if (total <= 0) return 0;
  return Math.min(100, (offer.repaid / total) * 100);
}
