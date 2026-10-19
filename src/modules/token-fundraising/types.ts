import type { ChainJson, IcoOffering, IcoStatus, IcoTier, PaymentToken } from '../../core/ChainStore';

export type { IcoOffering, IcoStatus, IcoTier };

export const NATIVE_PAYMENT_KEY = 'native';

export interface TierFormState {
  id: string;
  name: string;
  price: string;
  allocation: string;
  maxPerWallet: string;
}

export interface IcoFormState {
  name: string;
  paymentTokenKey: string;
  price: string;
  hardCap: string;
  softCap: string;
  minContribution: string;
  maxContribution: string;
  startDate: string;
  endDate: string;
  tgeDate: string;
  tiers: TierFormState[];
}

export interface PaymentTokenOption {
  key: string;
  symbol: string;
  address: string;
  isNative: boolean;
}

export interface ValidationIssue {
  field: string;
  messageKey: string;
  params?: Record<string, string | number>;
}

export interface IcoValidationContext {
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

export function formatDateTime(value: string, locale?: string): string {
  if (!value) return '—';
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

export function buildOfferingId(chainId: number, name: string, timestamp: number): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'ico';
  return `${chainId}-${slug}-${timestamp.toString(36)}`;
}

export function createInitialForm(): IcoFormState {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return {
    name: '',
    paymentTokenKey: NATIVE_PAYMENT_KEY,
    price: '',
    hardCap: '',
    softCap: '',
    minContribution: '',
    maxContribution: '',
    startDate: toLocalInputValue(new Date(now + day)),
    endDate: toLocalInputValue(new Date(now + 14 * day)),
    tgeDate: toLocalInputValue(new Date(now + 15 * day)),
    tiers: [],
  };
}

export function createEmptyTier(index: number): TierFormState {
  return {
    id: `tier-${index}-${Date.now().toString(36)}`,
    name: '',
    price: '',
    allocation: '',
    maxPerWallet: '',
  };
}

export function normalizePaymentTokens(chain: ChainJson | null): PaymentTokenOption[] {
  const options: PaymentTokenOption[] = [];
  if (!chain) return options;

  const entries = (chain.PaymentTokens ?? {}) as unknown as Record<string, PaymentToken | string>;

  Object.entries(entries).forEach(([key, value]) => {
    if (typeof value === 'string') {
      if (!value) return;
      options.push({ key, symbol: key, address: value, isNative: false });
      return;
    }
    if (value && typeof value === 'object') {
      const address = value.address ?? '';
      if (!address) return;
      options.push({ key, symbol: value.name || key, address, isNative: false });
    }
  });

  options.unshift({
    key: NATIVE_PAYMENT_KEY,
    symbol: chain.symbol,
    address: '',
    isNative: true,
  });

  return options;
}

export function parseTiers(form: IcoFormState): IcoTier[] {
  return form.tiers
    .filter(tier => tier.name.trim().length > 0)
    .map(tier => ({
      name: tier.name.trim(),
      price: toNumber(tier.price),
      allocation: toNumber(tier.allocation),
      maxPerWallet: toNumber(tier.maxPerWallet),
    }));
}

export function totalTierAllocation(form: IcoFormState): number {
  return form.tiers.reduce((sum, tier) => sum + toNumber(tier.allocation), 0);
}

export function validateIcoForm(
  form: IcoFormState,
  context: IcoValidationContext = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!form.name.trim()) {
    issues.push({ field: 'name', messageKey: 'tokenFundraising.validation.nameRequired' });
  }
  if (!form.paymentTokenKey) {
    issues.push({ field: 'paymentTokenKey', messageKey: 'tokenFundraising.validation.paymentMethodRequired' });
  }
  if (!isPositive(form.price)) {
    issues.push({ field: 'price', messageKey: 'tokenFundraising.validation.priceRequired' });
  }

  const hardCap = toNumber(form.hardCap);
  if (!isPositive(form.hardCap)) {
    issues.push({ field: 'hardCap', messageKey: 'tokenFundraising.validation.hardCapRequired' });
  } else if (context.tokenSupply !== undefined && hardCap > context.tokenSupply) {
    issues.push({
      field: 'hardCap',
      messageKey: 'tokenFundraising.validation.hardCapExceedsSupply',
      params: { supply: formatAmount(context.tokenSupply) },
    });
  }

  const softCap = toNumber(form.softCap);
  if (!isPositive(form.softCap)) {
    issues.push({ field: 'softCap', messageKey: 'tokenFundraising.validation.softCapRequired' });
  } else if (hardCap > 0 && softCap > hardCap) {
    issues.push({ field: 'softCap', messageKey: 'tokenFundraising.validation.softCapAboveHardCap' });
  }

  const minContribution = toNumber(form.minContribution);
  const maxContribution = toNumber(form.maxContribution);
  if (!isPositive(form.minContribution)) {
    issues.push({ field: 'minContribution', messageKey: 'tokenFundraising.validation.minContributionRequired' });
  }
  if (!isPositive(form.maxContribution)) {
    issues.push({ field: 'maxContribution', messageKey: 'tokenFundraising.validation.maxContributionRequired' });
  }
  if (minContribution > 0 && maxContribution > 0 && maxContribution < minContribution) {
    issues.push({ field: 'maxContribution', messageKey: 'tokenFundraising.validation.maxBelowMin' });
  }

  const start = form.startDate ? new Date(form.startDate) : null;
  const end = form.endDate ? new Date(form.endDate) : null;
  const tge = form.tgeDate ? new Date(form.tgeDate) : null;
  const startValid = !!start && !Number.isNaN(start.getTime());
  const endValid = !!end && !Number.isNaN(end.getTime());
  const tgeValid = !!tge && !Number.isNaN(tge.getTime());

  if (!startValid) {
    issues.push({ field: 'startDate', messageKey: 'tokenFundraising.validation.startRequired' });
  }
  if (!endValid) {
    issues.push({ field: 'endDate', messageKey: 'tokenFundraising.validation.endRequired' });
  }
  if (startValid && endValid && end.getTime() <= start.getTime()) {
    issues.push({ field: 'endDate', messageKey: 'tokenFundraising.validation.endBeforeStart' });
  }
  if (!tgeValid) {
    issues.push({ field: 'tgeDate', messageKey: 'tokenFundraising.validation.tgeRequired' });
  } else if (endValid && tge.getTime() < end.getTime()) {
    issues.push({ field: 'tgeDate', messageKey: 'tokenFundraising.validation.tgeBeforeEnd' });
  }

  form.tiers.forEach(tier => {
    if (!tier.name.trim()) {
      issues.push({ field: `tier.${tier.id}.name`, messageKey: 'tokenFundraising.validation.tierNameRequired' });
    }
    if (!isPositive(tier.price)) {
      issues.push({ field: `tier.${tier.id}.price`, messageKey: 'tokenFundraising.validation.tierPriceRequired' });
    }
    if (!isPositive(tier.allocation)) {
      issues.push({ field: `tier.${tier.id}.allocation`, messageKey: 'tokenFundraising.validation.tierAllocationRequired' });
    }
  });

  if (form.tiers.length > 0 && hardCap > 0 && totalTierAllocation(form) > hardCap) {
    issues.push({ field: 'tiers', messageKey: 'tokenFundraising.validation.tierAllocationExceedsCap' });
  }

  return issues;
}

export function computeProgress(offering: IcoOffering): number {
  if (!offering.hardCap) return 0;
  return Math.min(100, (offering.sold / offering.hardCap) * 100);
}
