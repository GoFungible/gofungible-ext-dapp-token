import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, Gift, Loader2, Network } from 'lucide-react';
import mockChains from '@data/chains';
import { useChainStore } from '../chains/ChainStore';
import { AirdropForm } from './components/AirdropForm';
import { AirdropCard } from './components/AirdropCard';
import { useAirdropManager } from './hooks/useAirdropManager';
import {
  createInitialForm,
  formatAmount,
  validateAirdropForm,
  type AirdropFormState,
  type ValidationIssue,
} from './types';

export function TokenDistribution() {
  const { t, i18n } = useTranslation();
  const { selectedChainId, selectedChain, selectChain } = useChainStore();
  const { launchAirdrop, distributeTo, closeAirdrop, isLaunching, pendingCampaignId } = useAirdropManager();

  const [form, setForm] = useState<AirdropFormState>(() => createInitialForm());
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [showIssues, setShowIssues] = useState(false);

  useEffect(() => {
    if (!selectedChainId && mockChains.length > 0) {
      void selectChain(mockChains[0].id);
    }
  }, [selectedChainId, selectChain]);

  const tokenSupply = useMemo(() => {
    const raw = selectedChain?.token?.totalSupply ? Number(selectedChain.token.totalSupply) : undefined;
    return raw !== undefined && Number.isFinite(raw) ? raw : undefined;
  }, [selectedChain]);

  const issues: ValidationIssue[] = useMemo(
    () => validateAirdropForm(form, { tokenSupply }),
    [form, tokenSupply],
  );

  const campaigns = useMemo(
    () => Object.values(selectedChain?.Airdrops ?? {}).sort((a, b) => b.createdAt - a.createdAt),
    [selectedChain],
  );

  const handleChainChange = (chainId: number) => {
    void selectChain(chainId);
    setError(undefined);
    setSuccess(undefined);
    setShowIssues(false);
  };

  const handleLaunch = async () => {
    setError(undefined);
    setSuccess(undefined);

    if (issues.length > 0) {
      setShowIssues(true);
      setError(t('tokenDistribution.error.invalidForm'));
      return;
    }

    const result = await launchAirdrop(form);
    if (!result.ok) {
      setError(
        result.messageKey ? t(result.messageKey, result.params) : t('tokenDistribution.error.launchFailed'),
      );
      return;
    }

    setForm(createInitialForm());
    setShowIssues(false);
    setSuccess(
      t('tokenDistribution.success.launched', {
        name: form.name.trim(),
        chain: selectedChain?.name ?? '',
      }),
    );
  };

  const handleDistribute = async (campaignId: string, address: string, mode: 'sent' | 'claimed') => {
    setError(undefined);
    setSuccess(undefined);

    const result = await distributeTo(campaignId, address, mode);
    if (!result.ok) {
      setError(
        result.messageKey ? t(result.messageKey, result.params) : t('tokenDistribution.error.distributeFailed'),
      );
      return;
    }

    const campaign = campaigns.find(item => item.id === campaignId);
    const recipient = campaign?.recipients.find(item => item.address.toLowerCase() === address.toLowerCase());
    setSuccess(
      mode === 'claimed'
        ? t('tokenDistribution.success.claimed', {
            amount: formatAmount(recipient?.amount ?? 0),
            symbol: campaign?.tokenSymbol ?? '',
            address,
          })
        : t('tokenDistribution.success.sent', {
            amount: formatAmount(recipient?.amount ?? 0),
            symbol: campaign?.tokenSymbol ?? '',
            address,
          }),
    );
  };

  const handleClose = async (campaignId: string) => {
    setError(undefined);
    setSuccess(undefined);

    const result = await closeAirdrop(campaignId);
    if (!result.ok) {
      setError(result.messageKey ? t(result.messageKey, result.params) : t('tokenDistribution.error.closeFailed'));
      return;
    }

    const campaign = campaigns.find(item => item.id === campaignId);
    setSuccess(t('tokenDistribution.success.closed', { name: campaign?.name ?? '' }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Gift className="h-8 w-8 text-purple-600" />
          {t('tokenDistribution.title')}
        </h1>
        <p className="text-muted mt-1">{t('tokenDistribution.subtitle')}</p>
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
          htmlFor="distribution-chain"
          className="block text-xs font-medium text-muted uppercase tracking-wide mb-2"
        >
          {t('tokenDistribution.selectChain')}
        </label>
        <select
          id="distribution-chain"
          value={selectedChainId}
          onChange={e => handleChainChange(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-surface focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono text-sm"
          disabled={isLaunching}
        >
          {mockChains.map(chain => (
            <option key={chain.id} value={chain.id}>
              {t('tokenDistribution.chainOption', {
                name: chain.name,
                symbol: chain.symbol,
                id: chain.id,
              })}
            </option>
          ))}
        </select>

        {selectedChain && (
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Network className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {t('tokenDistribution.chainHeader', { name: selectedChain.name, id: selectedChain.id })}
              </p>
              <p className="text-sm text-muted">
                {selectedChain.token
                  ? `${selectedChain.token.name} • ${selectedChain.token.symbol} • ${selectedChain.token.decimals} ${t('tokenDistribution.decimals')}`
                  : t('tokenDistribution.error.noToken')}
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
        <AirdropForm
          form={form}
          onChange={setForm}
          issues={showIssues ? issues : []}
          tokenSymbol={selectedChain.token?.symbol ?? '—'}
          tokenAddress={selectedChain.token?.address ?? ''}
          isLaunching={isLaunching}
          onLaunch={() => { void handleLaunch(); }}
        />
      )}

      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5 text-purple-600" />
          {t('tokenDistribution.campaigns')}
        </h2>

        {campaigns.length === 0 ? (
          <div className="bg-surface rounded-xl border border-gray-200 p-8 text-center text-muted">
            {t('tokenDistribution.noCampaigns')}
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map(campaign => (
              <AirdropCard
                key={campaign.id}
                campaign={campaign}
                locale={i18n.language}
                explorer={selectedChain?.blockExplorer ?? ''}
                isPending={pendingCampaignId === campaign.id}
                onDistribute={(id, address, mode) => { void handleDistribute(id, address, mode); }}
                onClose={id => { void handleClose(id); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
