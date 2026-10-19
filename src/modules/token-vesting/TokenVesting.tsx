import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, Hourglass, Loader2, Network } from 'lucide-react';
import mockChains from '@data/chains';
import { useChainStore } from '../../core/ChainStore';
import { VestingForm } from './components/VestingForm';
import { VestingCard } from './components/VestingCard';
import { useVestingManager } from './hooks/useVestingManager';
import {
  buildSourceOptions,
  createInitialForm,
  formatAmount,
  releasableAmount,
  validateVestingForm,
  type ValidationIssue,
  type VestingFormState,
} from './types';

export function TokenVesting() {
  const { t, i18n } = useTranslation();
  const { selectedChainId, selectedChain, selectChain } = useChainStore();
  const { createSchedule, releaseTokens, cancelSchedule, isCreating, pendingScheduleId } = useVestingManager();

  const [form, setForm] = useState<VestingFormState>(() => createInitialForm());
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [showIssues, setShowIssues] = useState(false);

  useEffect(() => {
    if (!selectedChainId && mockChains.length > 0) {
      void selectChain(mockChains[0].id);
    }
  }, [selectedChainId, selectChain]);

  const sourceOptions = useMemo(
    () => buildSourceOptions(Object.values(selectedChain?.ICOs ?? {})),
    [selectedChain],
  );

  useEffect(() => {
    setForm(prev => {
      const stillValid = sourceOptions.some(option => option.key === prev.sourceKey);
      if (stillValid) return prev;
      return { ...prev, sourceKey: sourceOptions[0]?.key ?? '' };
    });
  }, [sourceOptions]);

  const tokenSupply = useMemo(() => {
    const raw = selectedChain?.token?.totalSupply ? Number(selectedChain.token.totalSupply) : undefined;
    return raw !== undefined && Number.isFinite(raw) ? raw : undefined;
  }, [selectedChain]);

  const issues: ValidationIssue[] = useMemo(
    () => validateVestingForm(form, { tokenSupply }),
    [form, tokenSupply],
  );

  const schedules = useMemo(
    () => Object.values(selectedChain?.VestingSchedules ?? {}).sort((a, b) => b.createdAt - a.createdAt),
    [selectedChain],
  );

  const handleChainChange = (chainId: number) => {
    void selectChain(chainId);
    setError(undefined);
    setSuccess(undefined);
    setShowIssues(false);
  };

  const handleSourceChange = (sourceKey: string) => {
    const option = sourceOptions.find(item => item.key === sourceKey);
    setForm(prev => ({
      ...prev,
      sourceKey,
      totalAmount: option && !option.isManual && option.amount > 0 ? String(option.amount) : prev.totalAmount,
    }));
  };

  const handleCreate = async () => {
    setError(undefined);
    setSuccess(undefined);

    if (issues.length > 0) {
      setShowIssues(true);
      setError(t('tokenVesting.error.invalidForm'));
      return;
    }

    const source = sourceOptions.find(option => option.key === form.sourceKey);
    if (!source) {
      setError(t('tokenVesting.error.invalidForm'));
      return;
    }

    const result = await createSchedule(form, source);
    if (!result.ok) {
      setError(
        result.messageKey ? t(result.messageKey, result.params) : t('tokenVesting.error.createFailed'),
      );
      return;
    }

    setForm(createInitialForm());
    setShowIssues(false);
    setSuccess(
      t('tokenVesting.success.created', {
        name: form.name.trim(),
        chain: selectedChain?.name ?? '',
      }),
    );
  };

  const handleRelease = async (scheduleId: string) => {
    setError(undefined);
    setSuccess(undefined);

    const schedule = schedules.find(item => item.id === scheduleId);
    const pending = schedule ? releasableAmount(schedule) : 0;

    const result = await releaseTokens(scheduleId);
    if (!result.ok) {
      setError(result.messageKey ? t(result.messageKey, result.params) : t('tokenVesting.error.releaseFailed'));
      return;
    }

    setSuccess(
      t('tokenVesting.success.released', {
        amount: formatAmount(pending),
        symbol: schedule?.tokenSymbol ?? '',
        beneficiary: schedule?.beneficiary ?? '',
      }),
    );
  };

  const handleCancel = async (scheduleId: string) => {
    setError(undefined);
    setSuccess(undefined);

    const result = await cancelSchedule(scheduleId);
    if (!result.ok) {
      setError(result.messageKey ? t(result.messageKey, result.params) : t('tokenVesting.error.cancelFailed'));
      return;
    }

    const schedule = schedules.find(item => item.id === scheduleId);
    setSuccess(t('tokenVesting.success.cancelled', { name: schedule?.name ?? '' }));
  };

  const totalVesting = schedules.reduce((sum, schedule) => sum + schedule.totalAmount, 0);
  const totalReleased = schedules.reduce((sum, schedule) => sum + schedule.releasedAmount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Hourglass className="h-8 w-8 text-indigo-600" />
          {t('tokenVesting.title')}
        </h1>
        <p className="text-muted mt-1">{t('tokenVesting.subtitle')}</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-gray-200 p-6">
        <label
          htmlFor="vesting-chain"
          className="block text-xs font-medium text-muted uppercase tracking-wide mb-2"
        >
          {t('tokenVesting.selectChain')}
        </label>
        <select
          id="vesting-chain"
          value={selectedChainId}
          onChange={e => handleChainChange(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono text-sm"
          disabled={isCreating}
        >
          {mockChains.map(chain => (
            <option key={chain.id} value={chain.id}>
              {t('tokenVesting.chainOption', {
                name: chain.name,
                symbol: chain.symbol,
                id: chain.id,
              })}
            </option>
          ))}
        </select>

        {selectedChain && (
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Network className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {t('tokenVesting.chainHeader', { name: selectedChain.name, id: selectedChain.id })}
              </p>
              <p className="text-sm text-muted">
                {selectedChain.token
                  ? `${selectedChain.token.name} • ${selectedChain.token.symbol} • ${selectedChain.token.decimals} ${t('tokenVesting.decimals')}`
                  : t('tokenVesting.error.noToken')}
              </p>
            </div>
          </div>
        )}

        {!selectedChain && (
          <div className="mt-4 flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}
      </div>

      {selectedChain && (
        <VestingForm
          form={form}
          onChange={next => {
            if (next.sourceKey !== form.sourceKey) {
              handleSourceChange(next.sourceKey);
              return;
            }
            setForm(next);
          }}
          sourceOptions={sourceOptions}
          issues={showIssues ? issues : []}
          tokenSymbol={selectedChain.token?.symbol ?? '—'}
          tokenAddress={selectedChain.token?.address ?? ''}
          isCreating={isCreating}
          onCreate={() => { void handleCreate(); }}
        />
      )}

      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Hourglass className="h-5 w-5 text-indigo-600" />
          {t('tokenVesting.schedules')}
        </h2>

        {schedules.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-surface rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('tokenVesting.totalVesting')}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatAmount(totalVesting)} {selectedChain?.token?.symbol ?? ''}
              </p>
            </div>
            <div className="bg-surface rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                {t('tokenVesting.totalReleased')}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatAmount(totalReleased)} {selectedChain?.token?.symbol ?? ''}
              </p>
            </div>
          </div>
        )}

        {schedules.length === 0 ? (
          <div className="bg-surface rounded-xl border border-gray-200 p-8 text-center text-muted">
            {t('tokenVesting.noSchedules')}
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map(schedule => (
              <VestingCard
                key={schedule.id}
                schedule={schedule}
                locale={i18n.language}
                explorer={selectedChain?.blockExplorer ?? ''}
                isPending={pendingScheduleId === schedule.id}
                onRelease={id => { void handleRelease(id); }}
                onCancel={id => { void handleCancel(id); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
