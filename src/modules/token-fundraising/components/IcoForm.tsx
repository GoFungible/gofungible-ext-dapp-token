import { useTranslation } from 'react-i18next';
import { AlertCircle, Loader2, Plus, Rocket, Trash2 } from 'lucide-react';
import type { IcoFormState, PaymentTokenOption, ValidationIssue } from '../types';

interface IcoFormProps {
  form: IcoFormState;
  onChange: (form: IcoFormState) => void;
  paymentOptions: PaymentTokenOption[];
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

export function IcoForm({
  form,
  onChange,
  paymentOptions,
  issues,
  tokenSymbol,
  tokenAddress,
  isLaunching,
  onLaunch,
}: IcoFormProps) {
  const { t } = useTranslation();

  const issueFor = (field: string) => {
    const issue = issues.find(item => item.field === field);
    if (!issue) return undefined;
    return t(issue.messageKey, issue.params);
  };

  const update = <K extends keyof IcoFormState>(key: K, value: IcoFormState[K]) => {
    onChange({ ...form, [key]: value });
  };

  const updateTier = (id: string, key: 'name' | 'price' | 'allocation' | 'maxPerWallet', value: string) => {
    onChange({
      ...form,
      tiers: form.tiers.map(tier => (tier.id === id ? { ...tier, [key]: value } : tier)),
    });
  };

  const addTier = () => {
    onChange({
      ...form,
      tiers: [
        ...form.tiers,
        { id: `tier-${form.tiers.length}-${Date.now().toString(36)}`, name: '', price: '', allocation: '', maxPerWallet: '' },
      ],
    });
  };

  const removeTier = (id: string) => {
    onChange({ ...form, tiers: form.tiers.filter(tier => tier.id !== id) });
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm';

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Rocket className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('tokenFundraising.configureIco')}</h2>
          <p className="text-sm text-muted">{t('tokenFundraising.configureIcoDesc')}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenFundraising.tokenForSale')}
          </p>
          <p className="text-sm font-medium text-foreground">{tokenSymbol}</p>
          <code className="text-xs font-mono text-muted break-all">{tokenAddress || '—'}</code>
        </div>
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('tokenFundraising.paymentMethod')}
          </p>
          <select
            id="ico-payment-token"
            value={form.paymentTokenKey}
            onChange={e => update('paymentTokenKey', e.target.value)}
            className={inputClass}
            disabled={isLaunching}
          >
            {paymentOptions.map(option => (
              <option key={option.key} value={option.key}>
                {option.isNative
                  ? t('tokenFundraising.paymentMethodNative', { symbol: option.symbol })
                  : `${option.symbol} — ${option.address}`}
              </option>
            ))}
          </select>
          {issueFor('paymentTokenKey') && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              {issueFor('paymentTokenKey')}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('tokenFundraising.offeringName')} htmlFor="ico-name" error={issueFor('name')}>
          <input
            id="ico-name"
            type="text"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            placeholder={t('tokenFundraising.offeringNamePlaceholder')}
            className={inputClass}
            disabled={isLaunching}
          />
        </Field>

        <Field label={t('tokenFundraising.pricePerToken')} htmlFor="ico-price" error={issueFor('price')}>
          <input
            id="ico-price"
            type="number"
            min="0"
            step="any"
            value={form.price}
            onChange={e => update('price', e.target.value)}
            placeholder="0.00"
            className={inputClass}
            disabled={isLaunching}
          />
        </Field>

        <Field label={t('tokenFundraising.hardCap')} htmlFor="ico-hard-cap" error={issueFor('hardCap')}>
          <input
            id="ico-hard-cap"
            type="number"
            min="0"
            step="any"
            value={form.hardCap}
            onChange={e => update('hardCap', e.target.value)}
            placeholder="0.00"
            className={inputClass}
            disabled={isLaunching}
          />
        </Field>

        <Field label={t('tokenFundraising.softCap')} htmlFor="ico-soft-cap" error={issueFor('softCap')}>
          <input
            id="ico-soft-cap"
            type="number"
            min="0"
            step="any"
            value={form.softCap}
            onChange={e => update('softCap', e.target.value)}
            placeholder="0.00"
            className={inputClass}
            disabled={isLaunching}
          />
        </Field>

        <Field
          label={t('tokenFundraising.minContribution')}
          htmlFor="ico-min-contribution"
          error={issueFor('minContribution')}
        >
          <input
            id="ico-min-contribution"
            type="number"
            min="0"
            step="any"
            value={form.minContribution}
            onChange={e => update('minContribution', e.target.value)}
            placeholder="0.00"
            className={inputClass}
            disabled={isLaunching}
          />
        </Field>

        <Field
          label={t('tokenFundraising.maxContribution')}
          htmlFor="ico-max-contribution"
          error={issueFor('maxContribution')}
        >
          <input
            id="ico-max-contribution"
            type="number"
            min="0"
            step="any"
            value={form.maxContribution}
            onChange={e => update('maxContribution', e.target.value)}
            placeholder="0.00"
            className={inputClass}
            disabled={isLaunching}
          />
        </Field>

        <Field label={t('tokenFundraising.saleStart')} htmlFor="ico-start" error={issueFor('startDate')}>
          <input
            id="ico-start"
            type="datetime-local"
            value={form.startDate}
            onChange={e => update('startDate', e.target.value)}
            className={inputClass}
            disabled={isLaunching}
          />
        </Field>

        <Field label={t('tokenFundraising.saleEnd')} htmlFor="ico-end" error={issueFor('endDate')}>
          <input
            id="ico-end"
            type="datetime-local"
            value={form.endDate}
            onChange={e => update('endDate', e.target.value)}
            className={inputClass}
            disabled={isLaunching}
          />
        </Field>

        <Field label={t('tokenFundraising.tgeDate')} htmlFor="ico-tge" error={issueFor('tgeDate')}>
          <input
            id="ico-tge"
            type="datetime-local"
            value={form.tgeDate}
            onChange={e => update('tgeDate', e.target.value)}
            className={inputClass}
            disabled={isLaunching}
          />
        </Field>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">{t('tokenFundraising.tiers')}</h3>
          <button
            type="button"
            onClick={addTier}
            disabled={isLaunching}
            className="px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-xs font-medium flex items-center gap-1 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('tokenFundraising.addTier')}
          </button>
        </div>

        {form.tiers.length === 0 ? (
          <p className="text-xs text-muted">{t('tokenFundraising.noTiers')}</p>
        ) : (
          <div className="space-y-3">
            {form.tiers.map(tier => (
              <div key={tier.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={tier.name}
                    onChange={e => updateTier(tier.id, 'name', e.target.value)}
                    placeholder={t('tokenFundraising.tierName')}
                    className={inputClass}
                    disabled={isLaunching}
                  />
                  {issueFor(`tier.${tier.id}.name`) && (
                    <p className="text-xs text-red-600 mt-1">{issueFor(`tier.${tier.id}.name`)}</p>
                  )}
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={tier.price}
                    onChange={e => updateTier(tier.id, 'price', e.target.value)}
                    placeholder={t('tokenFundraising.tierPrice')}
                    className={inputClass}
                    disabled={isLaunching}
                  />
                  {issueFor(`tier.${tier.id}.price`) && (
                    <p className="text-xs text-red-600 mt-1">{issueFor(`tier.${tier.id}.price`)}</p>
                  )}
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={tier.allocation}
                    onChange={e => updateTier(tier.id, 'allocation', e.target.value)}
                    placeholder={t('tokenFundraising.tierAllocation')}
                    className={inputClass}
                    disabled={isLaunching}
                  />
                  {issueFor(`tier.${tier.id}.allocation`) && (
                    <p className="text-xs text-red-600 mt-1">{issueFor(`tier.${tier.id}.allocation`)}</p>
                  )}
                </div>
                <div className="sm:col-span-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={tier.maxPerWallet}
                    onChange={e => updateTier(tier.id, 'maxPerWallet', e.target.value)}
                    placeholder={t('tokenFundraising.tierMaxPerWallet')}
                    className={inputClass}
                    disabled={isLaunching}
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeTier(tier.id)}
                    disabled={isLaunching}
                    className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    aria-label={t('tokenFundraising.removeTier')}
                    title={t('tokenFundraising.removeTier')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {issueFor('tiers') && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                {issueFor('tiers')}
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
          className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLaunching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('tokenFundraising.launching')}
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              {t('tokenFundraising.launchIco')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
