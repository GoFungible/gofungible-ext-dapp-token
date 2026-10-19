import type {
  AirdropCampaign,
  AirdropClaimMode,
  AirdropRecipient,
  AirdropRecipientStatus,
  AirdropStatus,
} from '../../core/ChainStore';

export type { AirdropCampaign, AirdropClaimMode, AirdropRecipient, AirdropRecipientStatus, AirdropStatus };

export interface RecipientFormState {
  id: string;
  address: string;
  amount: string;
}

export interface AirdropFormState {
  name: string;
  totalAmount: string;
  minBalance: string;
  claimMode: AirdropClaimMode;
  deadline: string;
  recipients: RecipientFormState[];
}

export interface ValidationIssue {
  field: string;
  messageKey: string;
  params?: Record<string, string | number>;
}

export interface AirdropValidationContext {
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

export function buildCampaignId(chainId: number, name: string, timestamp: number): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'airdrop';
  return `${chainId}-${slug}-${timestamp.toString(36)}`;
}

export function createInitialForm(): AirdropFormState {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return {
    name: '',
    totalAmount: '',
    minBalance: '0',
    claimMode: 'claim',
    deadline: toLocalInputValue(new Date(now + 30 * day)),
    recipients: [],
  };
}

export function createEmptyRecipient(index: number): RecipientFormState {
  return {
    id: `recipient-${index}-${Date.now().toString(36)}`,
    address: '',
    amount: '',
  };
}

export function parseRecipients(form: AirdropFormState): AirdropRecipient[] {
  return form.recipients
    .filter(recipient => isValidAddress(recipient.address))
    .map(recipient => ({
      address: recipient.address.trim(),
      amount: toNumber(recipient.amount),
      status: 'pending',
    }));
}

export function totalRecipientAmount(form: AirdropFormState): number {
  return form.recipients.reduce((sum, recipient) => sum + toNumber(recipient.amount), 0);
}

export function validateAirdropForm(
  form: AirdropFormState,
  context: AirdropValidationContext = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!form.name.trim()) {
    issues.push({ field: 'name', messageKey: 'tokenDistribution.validation.nameRequired' });
  }

  const totalAmount = toNumber(form.totalAmount);
  if (!isPositive(form.totalAmount)) {
    issues.push({ field: 'totalAmount', messageKey: 'tokenDistribution.validation.totalAmountRequired' });
  } else if (context.tokenSupply !== undefined && totalAmount > context.tokenSupply) {
    issues.push({
      field: 'totalAmount',
      messageKey: 'tokenDistribution.validation.totalAmountExceedsSupply',
      params: { supply: formatAmount(context.tokenSupply) },
    });
  }

  if (toNumber(form.minBalance) < 0) {
    issues.push({ field: 'minBalance', messageKey: 'tokenDistribution.validation.minBalanceInvalid' });
  }

  const deadline = form.deadline ? new Date(form.deadline) : null;
  if (!deadline || Number.isNaN(deadline.getTime())) {
    issues.push({ field: 'deadline', messageKey: 'tokenDistribution.validation.deadlineRequired' });
  } else if (deadline.getTime() <= Date.now()) {
    issues.push({ field: 'deadline', messageKey: 'tokenDistribution.validation.deadlineInPast' });
  }

  if (form.recipients.length === 0) {
    issues.push({ field: 'recipients', messageKey: 'tokenDistribution.validation.recipientsRequired' });
  }

  form.recipients.forEach(recipient => {
    if (!isValidAddress(recipient.address)) {
      issues.push({
        field: `recipient.${recipient.id}.address`,
        messageKey: 'tokenDistribution.validation.recipientAddressInvalid',
      });
    }
    if (!isPositive(recipient.amount)) {
      issues.push({
        field: `recipient.${recipient.id}.amount`,
        messageKey: 'tokenDistribution.validation.recipientAmountRequired',
      });
    }
  });

  const duplicate = form.recipients
    .map(recipient => recipient.address.trim().toLowerCase())
    .filter((address, index, all) => address.length > 0 && all.indexOf(address) !== index);
  if (duplicate.length > 0) {
    issues.push({ field: 'recipients', messageKey: 'tokenDistribution.validation.duplicateRecipient' });
  }

  if (totalAmount > 0 && totalRecipientAmount(form) > totalAmount) {
    issues.push({
      field: 'recipients',
      messageKey: 'tokenDistribution.validation.recipientsExceedTotal',
      params: { total: formatAmount(totalAmount) },
    });
  }

  return issues;
}

export function computeAirdropProgress(campaign: AirdropCampaign): number {
  if (!campaign.totalAmount) return 0;
  return Math.min(100, (campaign.distributed / campaign.totalAmount) * 100);
}

export function pendingRecipients(campaign: AirdropCampaign): AirdropRecipient[] {
  return campaign.recipients.filter(recipient => recipient.status === 'pending');
}
