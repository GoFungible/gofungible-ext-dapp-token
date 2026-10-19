import { useTranslation } from 'react-i18next';
import { AlertCircle, Hourglass, Loader2, Rocket } from 'lucide-react';
import type { SourceOption, ValidationIssue, VestingFormState } from '../types';

interface VestingFormProps {
  form: VestingFormState;
  onChange: (form: VestingFormState) => void;
  sourceOptions: SourceOption[];
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

export function VestingForm({
  form,
  onChange,
  sourceOptions,
  issues,
  tokenSymbol,
  tokenAddress,
  isCreating,
  onCreate,
}: VestingFormProps) {
  const { t } = useTranslation();

  const issueFor = (field: string) => {
    const issue = issues.find(item => item.field === field);
    if (!issue) return undefined;
    return t(issue.messageKey, issue.params);
  };

  const update = <K extends keyof VestingFormState>(key: K, value: VestingFormState[K]) => {
    onChange({ ...form, [key]: value });
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm';

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Hourglass className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('tokenVesting.configureSchedule')}</h2>
          <p className="text-sm text-muted">{t('tokenVesting.configureScheduleDesc')}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenVesting.tokenToVest')}
          </p>
          <p className="text-sm font-medium text-foreground">{tokenSymbol}</p>
          <code className="text-xs font-mono text-muted break-all">{tokenAddress || '—'}</code>
        </div>
        <div>
          <label
            htmlFor="vesting-source"
            className="block text-xs font-medium text-muted uppercase tracking-wide mb-1"
          >
            {t('tokenVesting.sourceOffering')}
          </label>
          <select
            id="vesting-source"
            value={form.sourceKey}
            onChange={e => update('sourceKey', e.target.value)}
            className={inputClass}
            disabled={isCreating}
          >
            {sourceOptions.map(option => (
              <option key={option.key} value={option.key}>
                {option.isManual
                  ? t('tokenVesting.manualSource')
                  : `${option.name} — ${option.amount} ${tokenSymbol}`}
              </option>
            ))}
          </select>
          {issueFor('sourceKey') && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              {issueFor('sourceKey')}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('tokenVesting.scheduleName')} htmlFor="vesting-name" error={issueFor('name')}>
          <input
            id="vesting-name"
            type="text"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            placeholder={t('tokenVesting.scheduleNamePlaceholder')}
            className={inputClass}
            disabled={isCreating}
          />
        </Field>

        <Field
          label={t('tokenVesting.beneficiary')}
          htmlFor="vesting-beneficiary"
          error={issueFor('beneficiary')}
        >
          <input
            id="vesting-beneficiary"
            type="text"
            value={form.beneficiary}
            onChange={e => update('beneficiary', e.target.value)}
            placeholder={t('common.addressPlaceholder')}
            className={`${inputClass} font-mono`}
            disabled={isCreating}
          />
        </Field>

        <Field
          label={t('tokenVesting.totalAmount')}
          htmlFor="vesting-total"
          error={issueFor('totalAmount')}
        >
          <input
            id="vesting-total"
            type="number"
            min="0"
            step="any"
            value={form.totalAmount}
            onChange={e => update('totalAmount', e.target.value)}
            placeholder="0.00"
            className={inputClass}
            disabled={isCreating}
          />
        </Field>

        <Field label={t('tokenVesting.startDate')} htmlFor="vesting-start" error={issueFor('startDate')}>
          <input
            id="vesting-start"
            type="datetime-local"
            value={form.startDate}
            onChange={e => update('startDate', e.target.value)}
            className={inputClass}
            disabled={isCreating}
          />
        </Field>

        <Field label={t('tokenVesting.cliffDays')} htmlFor="vesting-cliff" error={issueFor('cliffDays')}>
          <input
            id="vesting-cliff"
            type="number"
            min="0"
            step="1"
            value={form.cliffDays}
            onChange={e => update('cliffDays', e.target.value)}
            placeholder="0"
            className={inputClass}
            disabled={isCreating}
          />
        </Field>

        <Field
          label={t('tokenVesting.durationDays')}
          htmlFor="vesting-duration"
          error={issueFor('durationDays')}
        >
          <input
            id="vesting-duration"
            type="number"
            min="0"
            step="1"
            value={form.durationDays}
            onChange={e => update('durationDays', e.target.value)}
            placeholder="90"
            className={inputClass}
            disabled={isCreating}
          />
        </Field>

        <Field label={t('tokenVesting.cadence')} htmlFor="vesting-cadence">
          <select
            id="vesting-cadence"
            value={form.cadence}
            onChange={e => update('cadence', e.target.value as VestingFormState['cadence'])}
            className={inputClass}
            disabled={isCreating}
          >
            <option value="linear">{t('tokenVesting.cadenceLinear')}</option>
            <option value="daily">{t('tokenVesting.cadenceDaily')}</option>
            <option value="weekly">{t('tokenVesting.cadenceWeekly')}</option>
            <option value="monthly">{t('tokenVesting.cadenceMonthly')}</option>
          </select>
        </Field>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onCreate}
          disabled={isCreating}
          className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('tokenVesting.creating')}
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              {t('tokenVesting.createSchedule')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
