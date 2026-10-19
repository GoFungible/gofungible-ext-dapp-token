import { useTranslation } from 'react-i18next';
import { AlertCircle, Landmark, Loader2, Percent, Rocket } from 'lucide-react';
import type { LenderOption, LendingFormState, ValidationIssue } from '../types';

interface LendingFormProps {
  form: LendingFormState;
  onChange: (form: LendingFormState) => void;
  lenderOptions: LenderOption[];
  issues: ValidationIssue[];
  tokenSymbol: string;
  tokenAddress: string;
  isCreating: boolean;
  onCreate: () => void;
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

export function LendingForm({
  form,
  onChange,
  lenderOptions,
  issues,
  tokenSymbol,
  tokenAddress,
  isCreating,
  onCreate,
}: LendingFormProps) {
  const { t } = useTranslation();

  const issueFor = (field: string) => {
    const issue = issues.find(item => item.field === field);
    if (!issue) return undefined;
    return t(issue.messageKey, issue.params);
  };

  const update = <K extends keyof LendingFormState>(key: K, value: LendingFormState[K]) => {
    onChange({ ...form, [key]: value });
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm';

  const hasPlatforms = lenderOptions.some(option => !option.isIssuer);

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Landmark className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('tokenLending.configureOffer')}</h2>
          <p className="text-sm text-muted">{t('tokenLending.configureOfferDesc')}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenLending.tokenToLend')}
          </p>
          <p className="text-sm font-medium text-foreground">{tokenSymbol}</p>
          <code className="text-xs font-mono text-muted break-all">{tokenAddress || '—'}</code>
        </div>
        <div>
          <label
            htmlFor="lending-platform"
            className="block text-xs font-medium text-muted uppercase tracking-wide mb-1"
          >
            {t('tokenLending.lendingPlatform')}
          </label>
          <select
            id="lending-platform"
            value={form.lenderKey}
            onChange={e => update('lenderKey', e.target.value)}
            className={inputClass}
            disabled={isCreating}
          >
            {lenderOptions.map(option => (
              <option key={option.key} value={option.key}>
                {option.isIssuer ? t('tokenLending.issuerLender') : `${option.name} — ${option.address}`}
              </option>
            ))}
          </select>
          {!hasPlatforms && (
            <p className="text-xs text-muted mt-1">{t('tokenLending.noLendingPlatforms')}</p>
          )}
          {issueFor('lenderKey') && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              {issueFor('lenderKey')}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('tokenLending.offerName')} htmlFor="lending-name" error={issueFor('name')}>
          <input
            id="lending-name"
            type="text"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            placeholder={t('tokenLending.offerNamePlaceholder')}
            className={inputClass}
            disabled={isCreating}
          />
        </Field>

        <Field label={t('tokenLending.principal')} htmlFor="lending-principal" error={issueFor('principal')}>
          <input
            id="lending-principal"
            type="number"
            min="0"
            step="any"
            value={form.principal}
            onChange={e => update('principal', e.target.value)}
            placeholder="0.00"
            className={inputClass}
            disabled={isCreating}
          />
        </Field>

        <Field
          label={t('tokenLending.interestRate')}
          htmlFor="lending-interest"
          error={issueFor('interestRate')}
        >
          <div className="relative">
            <input
              id="lending-interest"
              type="number"
              min="0"
              step="any"
              value={form.interestRate}
              onChange={e => update('interestRate', e.target.value)}
              placeholder="0.00"
              className={`${inputClass} pr-8`}
              disabled={isCreating}
            />
            <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          </div>
        </Field>

        <Field label={t('tokenLending.termDays')} htmlFor="lending-term" error={issueFor('termDays')}>
          <input
            id="lending-term"
            type="number"
            min="0"
            step="1"
            value={form.termDays}
            onChange={e => update('termDays', e.target.value)}
            placeholder="30"
            className={inputClass}
            disabled={isCreating}
          />
        </Field>

        <Field label={t('tokenLending.collateral')} htmlFor="lending-collateral" error={issueFor('collateral')}>
          <input
            id="lending-collateral"
            type="number"
            min="0"
            step="any"
            value={form.collateral}
            onChange={e => update('collateral', e.target.value)}
            placeholder="0.00"
            className={inputClass}
            disabled={isCreating}
          />
        </Field>

        <Field label={t('tokenLending.borrower')} htmlFor="lending-borrower" error={issueFor('borrower')}>
          <input
            id="lending-borrower"
            type="text"
            value={form.borrower}
            onChange={e => update('borrower', e.target.value)}
            placeholder={t('tokenLending.borrowerPlaceholder')}
            className={`${inputClass} font-mono`}
            disabled={isCreating}
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onCreate}
          disabled={isCreating}
          className="px-6 py-2.5 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('tokenLending.creating')}
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              {t('tokenLending.createOffer')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
