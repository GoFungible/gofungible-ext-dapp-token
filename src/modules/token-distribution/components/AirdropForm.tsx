import { useTranslation } from 'react-i18next';
import { AlertCircle, Gift, Loader2, Plus, Rocket, Trash2, Users } from 'lucide-react';
import type { AirdropFormState, ValidationIssue } from '../types';

interface AirdropFormProps {
  form: AirdropFormState;
  onChange: (form: AirdropFormState) => void;
  issues: ValidationIssue[];
  tokenSymbol: string;
  tokenAddress: string;
  isLaunching: boolean;
  onLaunch: () => void;
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export function AirdropForm({
  form,
  onChange,
  issues,
  tokenSymbol,
  tokenAddress,
  isLaunching,
  onLaunch,
}: AirdropFormProps) {
  const { t } = useTranslation();

  const issueFor = (field: string) => {
    const issue = issues.find(item => item.field === field);
    if (!issue) return undefined;
    return t(issue.messageKey, issue.params);
  };

  const update = <K extends keyof AirdropFormState>(key: K, value: AirdropFormState[K]) => {
    onChange({ ...form, [key]: value });
  };

  const updateRecipient = (id: string, key: 'address' | 'amount', value: string) => {
    onChange({
      ...form,
      recipients: form.recipients.map(recipient =>
        recipient.id === id ? { ...recipient, [key]: value } : recipient,
      ),
    });
  };

  const addRecipient = () => {
    onChange({
      ...form,
      recipients: [
        ...form.recipients,
        { id: `recipient-${form.recipients.length}-${Date.now().toString(36)}`, address: '', amount: '' },
      ],
    });
  };

  const removeRecipient = (id: string) => {
    onChange({ ...form, recipients: form.recipients.filter(recipient => recipient.id !== id) });
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm';

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <Gift className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('tokenDistribution.configureAirdrop')}</h2>
          <p className="text-sm text-muted">{t('tokenDistribution.configureAirdropDesc')}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
          {t('tokenDistribution.tokenForDistribution')}
        </p>
        <p className="text-sm font-medium text-foreground">{tokenSymbol}</p>
        <code className="text-xs font-mono text-muted break-all">{tokenAddress || '—'}</code>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('tokenDistribution.campaignName')} htmlFor="airdrop-name" error={issueFor('name')}>
          <input
            id="airdrop-name"
            type="text"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            placeholder={t('tokenDistribution.campaignNamePlaceholder')}
            className={inputClass}
            disabled={isLaunching}
          />
        </Field>

        <Field
          label={t('tokenDistribution.totalAmount')}
          htmlFor="airdrop-total"
          error={issueFor('totalAmount')}
        >
          <input
            id="airdrop-total"
            type="number"
            min="0"
            step="any"
            value={form.totalAmount}
            onChange={e => update('totalAmount', e.target.value)}
            placeholder="0.00"
            className={inputClass}
            disabled={isLaunching}
          />
        </Field>

        <Field
          label={t('tokenDistribution.minBalance')}
          htmlFor="airdrop-min-balance"
          error={issueFor('minBalance')}
        >
          <input
            id="airdrop-min-balance"
            type="number"
            min="0"
            step="any"
            value={form.minBalance}
            onChange={e => update('minBalance', e.target.value)}
            placeholder="0.00"
            className={inputClass}
            disabled={isLaunching}
          />
        </Field>

        <Field label={t('tokenDistribution.claimMode')} htmlFor="airdrop-claim-mode">
          <select
            id="airdrop-claim-mode"
            value={form.claimMode}
            onChange={e => update('claimMode', e.target.value as AirdropFormState['claimMode'])}
            className={inputClass}
            disabled={isLaunching}
          >
            <option value="claim">{t('tokenDistribution.claimModeClaim')}</option>
            <option value="push">{t('tokenDistribution.claimModePush')}</option>
          </select>
        </Field>

        <Field label={t('tokenDistribution.deadline')} htmlFor="airdrop-deadline" error={issueFor('deadline')}>
          <input
            id="airdrop-deadline"
            type="datetime-local"
            value={form.deadline}
            onChange={e => update('deadline', e.target.value)}
            className={inputClass}
            disabled={isLaunching}
          />
        </Field>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            {t('tokenDistribution.recipients')}
          </h3>
          <button
            type="button"
            onClick={addRecipient}
            disabled={isLaunching}
            className="px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-xs font-medium flex items-center gap-1 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('tokenDistribution.addRecipient')}
          </button>
        </div>

        {form.recipients.length === 0 ? (
          <p className="text-xs text-muted">{t('tokenDistribution.noRecipients')}</p>
        ) : (
          <div className="space-y-3">
            {form.recipients.map(recipient => (
              <div key={recipient.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                <div className="sm:col-span-8">
                  <input
                    type="text"
                    value={recipient.address}
                    onChange={e => updateRecipient(recipient.id, 'address', e.target.value)}
                    placeholder={t('tokenDistribution.recipientAddress')}
                    className={inputClass}
                    disabled={isLaunching}
                  />
                  {issueFor(`recipient.${recipient.id}.address`) && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                      {issueFor(`recipient.${recipient.id}.address`)}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={recipient.amount}
                    onChange={e => updateRecipient(recipient.id, 'amount', e.target.value)}
                    placeholder={t('tokenDistribution.recipientAmount')}
                    className={inputClass}
                    disabled={isLaunching}
                  />
                  {issueFor(`recipient.${recipient.id}.amount`) && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                      {issueFor(`recipient.${recipient.id}.amount`)}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeRecipient(recipient.id)}
                    disabled={isLaunching}
                    className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    aria-label={t('tokenDistribution.removeRecipient')}
                    title={t('tokenDistribution.removeRecipient')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {issueFor('recipients') && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                {issueFor('recipients')}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onLaunch}
          disabled={isLaunching}
          className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLaunching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('tokenDistribution.launching')}
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              {t('tokenDistribution.launchAirdrop')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
