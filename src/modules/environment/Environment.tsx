import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useChains, useChainId } from 'wagmi';
import type { Address } from 'viem';
import {
  Network,
  Settings,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import {
  EnvironmentChainState,
} from './types';
import { eventBus } from '../../core/EventBus';
import mockChains from '@data/chains';
import { useCreate2Deploy } from './hooks/useCreate2Deploy';
import { useDeployFungibleProxy } from './hooks/useDeployFungibleProxy';
import { useDeployFungibleFactory } from './hooks/useDeployFungibleFactory';
import { useDeployFungibleEnvironment } from './hooks/useDeployFungibleEnvironment';
import { useAddChain } from './hooks/useAddChain';
import { useChainStore, type ChainJson } from '../../core/ChainStore';

function StatusBadge({ deployed }: { deployed: boolean }) {
  const { t } = useTranslation();
  if (deployed) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
        <CheckCircle className="h-3 w-3" />
        {t('environment.deployed')}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-muted bg-gray-50 px-2 py-1 rounded-full">
      <XCircle className="h-3 w-3" />
      {t('environment.notDeployed')}
    </span>
  );
}

function AddressRow({
  address,
  deployed,
  showExplorer,
  explorer,
}: {
  address: string | null;
  deployed: boolean;
  showExplorer?: boolean;
  explorer?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <StatusBadge deployed={deployed} />
        {address ? (
          <code className="text-sm font-mono text-foreground truncate max-w-[220px]">
            {address.slice(0, 10)}...{address.slice(-8)}
          </code>
        ) : (
          <span className="text-sm text-muted font-mono">—</span>
        )}
      </div>
      {address && showExplorer && explorer && (
        <a
          href={`${explorer}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted hover:text-muted"
          aria-label={t('environment.viewOnExplorer')}
          title={t('environment.viewOnExplorer')}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

function TokenDeployment({
  state,
  onDeploy,
  isLoading,
  explorer,
  chainAdded,
}: {
  state: EnvironmentChainState;
  onDeploy: () => void;
  isLoading: boolean;
  explorer: string;
  chainAdded: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-600" />
          {t('environment.tokenContract')}
        </h3>
        <StatusBadge deployed={state.create2Factory.deployed} />
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('environment.currentCreate2FactoryAddress')}
          </p>
          <div className="space-y-1">
            {Object.keys(state.create2Factory.entries).length > 0 ? (
              Object.entries(state.create2Factory.entries).map(([key, entry]) => (
                <div key={key} className="flex items-center gap-1">
                  <span className="text-xs text-muted">{key}</span>
                  <AddressRow
                    address={entry.address}
                    deployed={true}
                    showExplorer={!!explorer}
                    explorer={explorer}
                  />
                </div>
              ))
            ) : (
              <span className="text-xs text-muted">{t('environment.noCreate2FactoryAddresses')}</span>
            )}
          </div>
        </div>

      <div className="flex justify-end mt-auto">
        <button
          onClick={onDeploy}
          disabled={isLoading || !chainAdded}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          title={t('environment.deployCreate2Factory')}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.deploying')}
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              {t('environment.deployCreate2Factory')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function FungibleProxyDeployment({
  state,
  create2Salt,
  setCreate2Salt,
	onDeploy,
  isLoading,
  explorer,
  factories,
  selectedFactory,
  setSelectedFactory,
}: {
  state: EnvironmentChainState;
  create2Salt: string;
  setCreate2Salt: (value: string) => void;
  onDeploy: () => void;
  isLoading: boolean;
  explorer: string;
  factories: { label: string; address: string; desc?: string }[];
  selectedFactory: string;
  setSelectedFactory: (value: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          {t('environment.fungibleProxyContract')}
        </h3>
        <StatusBadge deployed={state.fungibleProxy.deployed} />
      </div>

      <p className="text-sm text-muted">
        {t('environment.fungibleProxyDesc')}
      </p>

      <div>
        <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
          {t('environment.create2FactorySelect')}
        </label>
        <select
          value={selectedFactory}
          onChange={e => setSelectedFactory(e.target.value)}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white"
        >
          <option value="">{t('environment.create2FactorySelectPlaceholder')}</option>
          {factories.map(f => (
            <option key={f.address} value={f.address}>
              {f.label} - {f.address.slice(0, 10)}...{f.address.slice(-8)}
            </option>
          ))}
        </select>
        {selectedFactory && (
          <p className="mt-2 text-xs text-muted">
            {factories.find(f => f.address === selectedFactory)?.desc}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
          {t('environment.create2Salt')}
        </label>
        <input
          type="text"
          value={create2Salt}
          onChange={e => setCreate2Salt(e.target.value)}
          placeholder={t('environment.create2SaltPlaceholder')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
          disabled={isLoading}
        />
      </div>

      {state.fungibleProxy.address && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
            {t('environment.proxyAddress')}
          </p>
          <AddressRow
            address={state.fungibleProxy.address}
            deployed={state.fungibleProxy.deployed}
            showExplorer={!!explorer}
            explorer={explorer}
          />
        </div>
      )}

      <div className="flex justify-end mt-auto">
        <button
          onClick={onDeploy}
          disabled={isLoading || !selectedFactory || !create2Salt}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          title={t('environment.deployFungibleProxy')}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.deploying')}
            </>
          ) : state.fungibleProxy.deployed ? (
            t('environment.proxyDeployed')
          ) : (
            <>
            <Plus className="h-4 w-4" />
            {t('environment.deployFungibleProxy')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function FungibleFactoryDeployment({
  state,
  onDeploy,
  onSetInFactory,
  isDeploying,
  isSetInLoading,
  explorer,
}: {
  state: EnvironmentChainState;
  onDeploy: () => void;
  onSetInFactory: () => void;
  isDeploying: boolean;
  isSetInLoading: boolean;
  explorer: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Network className="h-5 w-5 text-green-600" />
          {t('environment.fungibleFactoryContract')}
        </h3>
        <StatusBadge deployed={state.fungibleFactory.deployed} />
      </div>

      <p className="text-sm text-muted">
        {t('environment.fungibleFactoryDesc')}
      </p>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <AddressRow
          address={state.fungibleFactory.address}
          deployed={state.fungibleFactory.deployed}
          showExplorer={!!explorer}
          explorer={explorer}
        />
        <div className="flex items-center gap-2 mt-2">
          <div className={state.fungibleFactory.assigned ? 'text-green-600' : 'text-muted'}>
            {state.fungibleFactory.assigned ? <CheckCircle className="h-4 w-4 inline" /> : <XCircle className="h-4 w-4 inline" />}
          </div>
          <span className="text-sm text-muted">
            {state.fungibleFactory.assigned
              ? t('environment.assignedToProxy')
              : t('environment.notAssignedToProxy')}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          onClick={onDeploy}
          disabled={isDeploying || !state.fungibleProxy.deployed || state.fungibleFactory.deployed}
          className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          title={t('environment.deployFactory')}
        >
          {isDeploying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.deploying')}
            </>
          ) : state.fungibleFactory.deployed ? (
            t('environment.factoryDeployed')
          ) : (
            <>
              <Plus className="h-4 w-4" />
              {t('environment.deployFactory')}
            </>
          )}
        </button>
        <button
          onClick={onSetInFactory}
          disabled={isSetInLoading || !state.fungibleFactory.deployed || state.fungibleFactory.assigned}
          className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          title={t('environment.setInFactory')}
        >
          {isSetInLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.deploying')}
            </>
          ) : state.fungibleFactory.assigned ? (
            t('environment.factoryAssigned')
          ) : (
            <>
              <Plus className="h-4 w-4" />
              {t('environment.setInFactory')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function FungibleEnvironmentDeployment({
  state,
  onDeploy,
  onSetInEnvironment,
  isDeploying,
  isSetInLoading,
  explorer,
}: {
  state: EnvironmentChainState;
  onDeploy: () => void;
  onSetInEnvironment: () => void;
  isDeploying: boolean;
  isSetInLoading: boolean;
  explorer: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Network className="h-5 w-5 text-blue-600" />
          {t('environment.fungibleEnvironmentContract')}
        </h3>
        <StatusBadge deployed={state.fungibleEnvironment.deployed} />
      </div>

      <p className="text-sm text-muted">
        {t('environment.fungibleEnvironmentDesc')}
      </p>

      <div className="bg-gray-50 rounded-lg p-4">
        <AddressRow
          address={state.fungibleEnvironment.address}
          deployed={state.fungibleEnvironment.deployed}
          showExplorer={!!explorer}
          explorer={explorer}
        />
        <div className="flex items-center gap-2 mt-2">
          <div className={state.fungibleEnvironment.assigned ? 'text-green-600' : 'text-muted'}>
            {state.fungibleEnvironment.assigned ? <CheckCircle className="h-4 w-4 inline" /> : <XCircle className="h-4 w-4 inline" />}
          </div>
          <span className="text-sm text-muted">
            {state.fungibleEnvironment.assigned
              ? t('environment.assignedToProxy')
              : t('environment.notAssignedToProxy')}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 mt-auto">
        <button
          onClick={onDeploy}
          disabled={isDeploying || state.fungibleEnvironment.deployed}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          title={t('environment.deployFungibleEnvironment')}
        >
          {isDeploying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.deploying')}
            </>
          ) : state.fungibleEnvironment.deployed ? (
            t('environment.environmentDeployed')
          ) : (
            <>
              <Plus className="h-4 w-4" />
              {t('environment.deployFungibleEnvironment')}
            </>
          )}
        </button>
        <button
          onClick={onSetInEnvironment}
          disabled={isSetInLoading || state.fungibleEnvironment.assigned}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          title={t('environment.setInEnvironment')}
        >
          {isSetInLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.deploying')}
            </>
          ) : state.fungibleEnvironment.assigned ? (
            t('environment.environmentAssigned')
          ) : (
            <>
              <Plus className="h-4 w-4" />
              {t('environment.setInEnvironment')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function PaymentTokens({
  tokens,
  explorer,
  onAdd,
  onRemove,
}: {
  tokens: Record<string, { name: string; address: string }>;
  explorer: string;
  onAdd: (name: string, address: string) => void;
  onRemove: (name: string) => void;
}) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const handleAdd = () => {
    if (!newName.trim() || !newAddress.trim()) return;
    onAdd(newName.trim(), newAddress.trim());
    setNewName('');
    setNewAddress('');
    setAdding(false);
  };

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Network className="h-5 w-5 text-blue-600" />
          {t('environment.paymentTokens')}
        </h3>
        <span className="text-xs font-medium text-muted bg-gray-50 px-2 py-1 rounded-full">
          {Object.keys(tokens).length}
        </span>
      </div>

      <p className="text-sm text-muted">
        {t('environment.paymentTokensDesc')}
      </p>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        {Object.keys(tokens).length > 0 ? (
          Object.entries(tokens).map(([key, token]) => {
            const tokenObj =
              typeof token === 'string'
                ? { name: key, address: token }
                : (token as { name?: string; address?: string });
            if (!tokenObj?.address || typeof tokenObj.address !== 'string' || tokenObj.address.length === 0) {
              return null;
            }
            const addr = tokenObj.address;
            const name = tokenObj.name || key;
            if (!addr) return null;
            return (
              <div key={key} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{name}</p>
                  <code className="text-xs font-mono text-muted">
                    {addr && addr.length > 8 ? `${addr.slice(0, 10)}...${addr.slice(-8)}` : addr}
                  </code>
                </div>
                <div className="flex items-center gap-1">
                  {explorer && addr && (
                    <a
                      href={`${explorer}/address/${addr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted hover:text-blue-600"
                      aria-label={t('environment.viewOnExplorer')}
                      title={t('environment.viewOnExplorer')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => onRemove(key)}
                    className="text-red-500 hover:text-red-700"
                    title={t('environment.removePaymentToken')}
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <span className="text-xs text-muted">{t('environment.noPaymentTokens')}</span>
        )}
      </div>

      {adding ? (
        <div className="space-y-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={t('environment.paymentTokenName')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
          />
          <input
            type="text"
            value={newAddress}
            onChange={e => setNewAddress(e.target.value)}
            placeholder={t('environment.paymentTokenAddress')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setAdding(false); setNewName(''); setNewAddress(''); }}
              className="px-3 py-1.5 text-sm text-muted hover:text-foreground"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newAddress.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('environment.addPaymentToken')}
            </button>
          </div>
        </div>
) : (
        <div className="flex justify-end">
          <button
            onClick={() => setAdding(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            title={t('environment.addPaymentToken')}
          >
            <Plus className="h-4 w-4" />
            {t('environment.addPaymentToken')}
          </button>
        </div>
      )}
    </div>
  );
}

function Relayers({
  relayers,
  explorer,
  onAdd,
  onRemove,
}: {
  relayers: Record<string, { name: string; address: string }>;
  explorer: string;
  onAdd: (name: string, address: string) => void;
  onRemove: (name: string) => void;
}) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const handleAdd = () => {
    if (!newName.trim() || !newAddress.trim()) return;
    onAdd(newName.trim(), newAddress.trim());
    setNewName('');
    setNewAddress('');
    setAdding(false);
  };

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Network className="h-5 w-5 text-blue-600" />
          {t('environment.relayers')}
        </h3>
        <span className="text-xs font-medium text-muted bg-gray-50 px-2 py-1 rounded-full">
          {Object.keys(relayers).length}
        </span>
      </div>

      <p className="text-sm text-muted">
        {t('environment.relayersDesc')}
      </p>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        {Object.keys(relayers).length > 0 ? (
          Object.entries(relayers).map(([key, relay]) => {
            if (!relay?.address || typeof relay.address !== 'string' || relay.address.length === 0) {
              return null;
            }
            const addr = relay.address;
            const name = relay.name || key;
            return (
              <div key={key} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{name}</p>
                  <code className="text-xs font-mono text-muted">
                    {addr && addr.length > 8 ? `${addr.slice(0, 10)}...${addr.slice(-8)}` : addr}
                  </code>
                </div>
                <div className="flex items-center gap-1">
                  {explorer && addr && (
                    <a
                      href={`${explorer}/address/${addr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted hover:text-blue-600"
                      aria-label={t('environment.viewOnExplorer')}
                      title={t('environment.viewOnExplorer')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => onRemove(key)}
                    className="text-red-500 hover:text-red-700"
                    title={t('environment.removeRelayer')}
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <span className="text-xs text-muted">{t('environment.noRelayers')}</span>
        )}
      </div>

      {adding ? (
        <div className="space-y-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={t('environment.relayerName')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
          />
          <input
            type="text"
            value={newAddress}
            onChange={e => setNewAddress(e.target.value)}
            placeholder={t('environment.relayerAddress')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setAdding(false); setNewName(''); setNewAddress(''); }}
              className="px-3 py-1.5 text-sm text-muted hover:text-foreground"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newAddress.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('environment.addRelayer')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            onClick={() => setAdding(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            title={t('environment.addRelayer')}
          >
            <Plus className="h-4 w-4" />
            {t('environment.addRelayer')}
          </button>
        </div>
      )}
    </div>
  );
}

function Exchanges({
  exchanges,
  explorer,
  onAdd,
  onRemove,
}: {
  exchanges: Record<string, { name: string; address: string }>;
  explorer: string;
  onAdd: (name: string, address: string) => void;
  onRemove: (name: string) => void;
}) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const handleAdd = () => {
    if (!newName.trim() || !newAddress.trim()) return;
    onAdd(newName.trim(), newAddress.trim());
    setNewName('');
    setNewAddress('');
    setAdding(false);
  };

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Network className="h-5 w-5 text-blue-600" />
          {t('environment.exchanges')}
        </h3>
        <span className="text-xs font-medium text-muted bg-gray-50 px-2 py-1 rounded-full">
          {Object.keys(exchanges).length}
        </span>
      </div>

      <p className="text-sm text-muted">
        {t('environment.exchangesDesc')}
      </p>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        {Object.keys(exchanges).length > 0 ? (
          Object.entries(exchanges).map(([key, exchange]) => {
            if (!exchange?.address || typeof exchange.address !== 'string' || exchange.address.length === 0) {
              return null;
            }
            const addr = exchange.address;
            const name = exchange.name || key;
            return (
              <div key={key} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{name}</p>
                  <code className="text-xs font-mono text-muted">
                    {addr && addr.length > 8 ? `${addr.slice(0, 10)}...${addr.slice(-8)}` : addr}
                  </code>
                </div>
                <div className="flex items-center gap-1">
                  {explorer && addr && (
                    <a
                      href={`${explorer}/address/${addr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted hover:text-blue-600"
                      aria-label={t('environment.viewOnExplorer')}
                      title={t('environment.viewOnExplorer')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => onRemove(key)}
                    className="text-red-500 hover:text-red-700"
                    title={t('environment.removeExchange')}
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <span className="text-xs text-muted">{t('environment.noExchanges')}</span>
        )}
      </div>

      {adding ? (
        <div className="space-y-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={t('environment.exchangeName')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
          />
          <input
            type="text"
            value={newAddress}
            onChange={e => setNewAddress(e.target.value)}
            placeholder={t('environment.exchangeAddress')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setAdding(false); setNewName(''); setNewAddress(''); }}
              className="px-3 py-1.5 text-sm text-muted hover:text-foreground"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newAddress.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('environment.addExchange')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            onClick={() => setAdding(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            title={t('environment.addExchange')}
          >
            <Plus className="h-4 w-4" />
            {t('environment.addExchange')}
          </button>
        </div>
      )}
    </div>
  );
}

function Lenders({
  lenders,
  explorer,
  onAdd,
  onRemove,
}: {
  lenders: Record<string, { name: string; address: string }>;
  explorer: string;
  onAdd: (name: string, address: string) => void;
  onRemove: (name: string) => void;
}) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const handleAdd = () => {
    if (!newName.trim() || !newAddress.trim()) return;
    onAdd(newName.trim(), newAddress.trim());
    setNewName('');
    setNewAddress('');
    setAdding(false);
  };

  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Network className="h-5 w-5 text-blue-600" />
          {t('environment.lendingPlatforms')}
        </h3>
        <span className="text-xs font-medium text-muted bg-gray-50 px-2 py-1 rounded-full">
          {Object.keys(lenders).length}
        </span>
      </div>

      <p className="text-sm text-muted">
        {t('environment.lendingPlatformsDesc')}
      </p>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        {Object.keys(lenders).length > 0 ? (
          Object.entries(lenders).map(([key, lender]) => {
            if (!lender?.address || typeof lender.address !== 'string' || lender.address.length === 0) {
              return null;
            }
            const addr = lender.address;
            const name = lender.name || key;
            return (
              <div key={key} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{name}</p>
                  <code className="text-xs font-mono text-muted">
                    {addr && addr.length > 8 ? `${addr.slice(0, 10)}...${addr.slice(-8)}` : addr}
                  </code>
                </div>
                <div className="flex items-center gap-1">
                  {explorer && addr && (
                    <a
                      href={`${explorer}/address/${addr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted hover:text-blue-600"
                      aria-label={t('environment.viewOnExplorer')}
                      title={t('environment.viewOnExplorer')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => onRemove(key)}
                    className="text-red-500 hover:text-red-700"
                    title={t('environment.removeLender')}
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <span className="text-xs text-muted">{t('environment.noLenders')}</span>
        )}
      </div>

      {adding ? (
        <div className="space-y-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={t('environment.lenderName')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
          />
          <input
            type="text"
            value={newAddress}
            onChange={e => setNewAddress(e.target.value)}
            placeholder={t('environment.lenderAddress')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setAdding(false); setNewName(''); setNewAddress(''); }}
              className="px-3 py-1.5 text-sm text-muted hover:text-foreground"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newAddress.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('environment.addLender')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            onClick={() => setAdding(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            title={t('environment.addLender')}
          >
            <Plus className="h-4 w-4" />
            {t('environment.addLender')}
          </button>
        </div>
      )}
    </div>
  );
}

export function Environment() {
  const { t } = useTranslation();
  const [chainStates, setChainStates] = useState<EnvironmentChainState[]>([]);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const { selectedChainId, selectedChain, selectChain, updateChainCreate2Factory, updateChainFungibleProxy, updateChainFungibleFactory, updateChainFungibleEnvironment, updateChainPaymentTokens, updateChainRelayers, updateChainExchanges, updateChainLenders, chainCache } = useChainStore();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [form, setForm] = useState({
    tokenAddress: '',
    useCreate2: true,
    create2Salt: 'fungible-token',
    selectedCreate2Factory: '',
  });
  const environmentInitializedRef = useRef(false);

  const { deployCreate2Factory, isDeploying: isDeployingCreate2 } = useCreate2Deploy();
  const { deployFungibleProxy, isDeploying: isDeployingProxy } = useDeployFungibleProxy();
  const { deployFungibleFactory, isDeploying: isDeployingFactory } = useDeployFungibleFactory();
  const { deployFungibleEnvironment, isDeploying: isDeployingEnvironment } = useDeployFungibleEnvironment();

  function buildCreate2Factory(
  cfg: { create2Factory?: Record<string, { address?: string; desc?: string }> } | null,
): EnvironmentChainState['create2Factory'] {
  if (!cfg?.create2Factory) {
    return { entries: {}, deployed: false };
  }
  const entries: Record<string, { address: string; desc?: string }> = {};
  for (const [key, val] of Object.entries(cfg.create2Factory)) {
    if (val?.address) {
      entries[key] = { address: val.address, desc: val.desc };
    }
  }
  return { entries, deployed: Object.keys(entries).length > 0 };
}

function buildEnvironmentState(c: ChainJson): EnvironmentChainState {
  const cfg = c as { create2Factory?: Record<string, { address?: string; desc?: string }> };
  const create2Factory = buildCreate2Factory(cfg);
  const proxyAddress = typeof c.FungibleProxy === 'string' && c.FungibleProxy ? c.FungibleProxy : null;
  const factoryAddress = typeof c.FungibleFactory === 'string' && c.FungibleFactory ? c.FungibleFactory : null;
  const environmentAddress = typeof c.FungibleEnvironment === 'string' && c.FungibleEnvironment ? c.FungibleEnvironment : null;
  return {
    chainId: c.id,
    token: {
      address: null,
      deployed: false,
      deploymentType: null,
    },
    create2Factory,
    fungibleProxy: { address: proxyAddress, deployed: !!proxyAddress, assigned: !!proxyAddress },
    fungibleFactory: { address: factoryAddress, deployed: !!factoryAddress, assigned: !!factoryAddress },
    fungibleEnvironment: { address: environmentAddress, deployed: !!environmentAddress, assigned: !!environmentAddress },
  };
}

  useEffect(() => {
    if (environmentInitializedRef.current) return;
    environmentInitializedRef.current = true;
    const initial: EnvironmentChainState[] = mockChains.map((c: ChainJson) => {
      const cached = chainCache[c.id];
      return buildEnvironmentState(cached ?? c);
    });
    setChainStates(initial);
    void selectChain(initial[0].chainId);
  }, [selectChain, chainCache]);

  useEffect(() => {
    const unsubscribe = eventBus.on('refresh-environment', () => {
const refreshed: EnvironmentChainState[] = mockChains.map((c: ChainJson) => {
      const cached = chainCache[c.id];
      return buildEnvironmentState(cached ?? c);
    });
      setChainStates(refreshed);
    });
    return () => unsubscribe();
  }, [chainCache]);

  const connectedChains = useChains();
  const activeChainId = useChainId();

  useEffect(() => {
    if (!activeChainId) return;
    void selectChain(Number(activeChainId));
  }, [activeChainId, selectChain]);

  const { addChain, switchChain, isAdding: isAddingChain, error: addChainError } =
    useAddChain();

  const selectedState = chainStates.find(c => c.chainId === selectedChainId);
  const isChainAdded = selectedChain ? connectedChains.some(c => c.id === selectedChainId) : false;
  const explorer = selectedChain?.blockExplorer || '';

  const availableFactories: { label: string; address: string; desc?: string }[] = [];
  if (selectedChain?.create2Factory) {
    for (const [key, val] of Object.entries(selectedChain.create2Factory)) {
      if (val?.address) {
        availableFactories.push({ label: key, address: val.address, desc: val.desc });
      }
    }
  }

  const handleAddChain = async () => {
    if (!selectedChain) return;
    const chain = {
      id: selectedChain.id,
      name: selectedChain.name,
      nativeCurrency: { name: selectedChain.symbol, symbol: selectedChain.symbol, decimals: 18 },
      rpcUrls: { default: { http: [selectedChain.rpcUrl] } },
    };
    setError(undefined);
    const added = await addChain(chain);
    if (added) {
      const switched = await switchChain(selectedChainId);
      if (!switched) {
        setError(t('environment.error.addChainToWallet'));
      }
    }
  };

  const handleDeployToken = async () => {
    if (!selectedState || !selectedChain || !deployCreate2Factory) return;
    if (!isChainAdded) {
      setError(t('environment.chainNotAdded', { name: selectedChain.name }));
      return;
    }

    setActiveStep('token');
    setError(undefined);
    setSuccess(undefined);

    try {
      const factoryAddress = await deployCreate2Factory(selectedChain.rpcUrl);
      if (!factoryAddress) {
        setError(t('environment.error.deployToken'));
        return;
      }

      updateChainCreate2Factory(selectedChainId, {
        deployed: { address: factoryAddress, desc: 'Create2Factory deployed from this dApp' },
      });

      const newState = { ...selectedState };
      newState.token = {
        address: factoryAddress,
        deployed: true,
        deploymentType: 'create2',
      };
      newState.create2Factory = {
        entries: {
          ...selectedState.create2Factory.entries,
          deployed: { address: factoryAddress, desc: 'Create2Factory deployed from this dApp' },
        },
        deployed: true,
      };

      setChainStates(prev =>
        prev.map(c => (c.chainId === selectedChainId ? newState : c))
      );

      eventBus.emit('environment:token-deployed', {
        chainId: selectedChainId,
        chainName: selectedChain?.name,
        deploymentType: 'create2',
        timestamp: Date.now(),
      });

      setSuccess(
        t('environment.success.tokenDeployed', { name: selectedChain?.name || '' })
      );
      setForm({ tokenAddress: '', useCreate2: true, create2Salt: 'fungible-token', selectedCreate2Factory: '' });
    } catch {
      setError(t('environment.error.deployToken'));
    } finally {
      setActiveStep(null);
    }
  };

  const handleDeployProxy = async () => {
    if (!selectedState || !selectedChain) return;
    if (!isChainAdded) {
      setError(t('environment.chainNotAdded', { name: selectedChain.name }));
      return;
    }
    if (!form.selectedCreate2Factory) {
      setError(t('environment.error.selectFactory'));
      return;
    }

    setActiveStep('proxy');
    setError(undefined);
    setSuccess(undefined);

    try {
      const proxyAddress = await deployFungibleProxy({
        factoryAddress: form.selectedCreate2Factory as Address,
        rpcUrl: selectedChain.rpcUrl,
        implementation: selectedState.token.address as Address,
        salt: form.create2Salt,
      });

      if (!proxyAddress) {
        setError(t('environment.error.deployProxy'));
        return;
      }

      const newState = { ...selectedState };
      newState.fungibleProxy = {
        address: proxyAddress,
        deployed: true,
        assigned: true,
      };

      updateChainFungibleProxy(selectedChainId, proxyAddress);

      setChainStates(prev =>
        prev.map(c => (c.chainId === selectedChainId ? newState : c))
      );

      eventBus.emit('environment:proxy-deployed', {
        chainId: selectedChainId,
        chainName: selectedChain?.name,
        timestamp: Date.now(),
      });

      setSuccess(t('environment.success.proxyDeployed', { name: selectedChain?.name || '' }));
    } catch {
      setError(t('environment.error.deployProxy'));
    } finally {
      setActiveStep(null);
    }
  };

  const handleDeployFactory = async () => {
    if (!selectedState || !selectedChain) return;
    if (!isChainAdded) {
      setError(t('environment.chainNotAdded', { name: selectedChain.name }));
      return;
    }

    setActiveStep('factory');
    setError(undefined);
    setSuccess(undefined);

    try {
      const factoryAddress = await deployFungibleFactory(selectedChain.rpcUrl);
      if (!factoryAddress) {
        setError(t('environment.error.deployFactory'));
        return;
      }

      const newState = { ...selectedState };
      newState.fungibleFactory = {
        address: factoryAddress,
        deployed: true,
        assigned: false,
      };

      updateChainFungibleFactory(selectedChainId, factoryAddress);

      setChainStates(prev =>
        prev.map(c => (c.chainId === selectedChainId ? newState : c))
      );

      eventBus.emit('environment:factory-deployed', {
        chainId: selectedChainId,
        chainName: selectedChain?.name,
        timestamp: Date.now(),
      });

      setSuccess(t('environment.success.factoryDeployed', { name: selectedChain?.name || '' }));
    } catch {
      setError(t('environment.error.deployFactory'));
    } finally {
      setActiveStep(null);
    }
  };

  const handleSetInFactory = async () => {
    if (!selectedState || !selectedState.fungibleFactory.deployed) return;

    setActiveStep('setInFactory');
    setError(undefined);
    setSuccess(undefined);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newState = { ...selectedState };
      newState.fungibleFactory = {
        ...newState.fungibleFactory,
        assigned: true,
      };

      setChainStates(prev =>
        prev.map(c => (c.chainId === selectedChainId ? newState : c))
      );

      eventBus.emit('environment:factory-assigned', {
        chainId: selectedChainId,
        chainName: selectedChain?.name,
        timestamp: Date.now(),
      });

      setSuccess(t('environment.success.factoryAssigned', { name: selectedChain?.name || '' }));
    } catch {
      setError(t('environment.error.setInFactory'));
    } finally {
      setActiveStep(null);
    }
  };

  const handleSetInEnvironment = async () => {
    if (!selectedState) return;

    setActiveStep('setInEnvironment');
    setError(undefined);
    setSuccess(undefined);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newState = { ...selectedState };
      newState.fungibleEnvironment = {
        ...newState.fungibleEnvironment,
        assigned: true,
      };

      setChainStates(prev =>
        prev.map(c => (c.chainId === selectedChainId ? newState : c))
      );

      eventBus.emit('environment:environment-assigned', {
        chainId: selectedChainId,
        chainName: selectedChain?.name,
        timestamp: Date.now(),
      });

      setSuccess(t('environment.success.environmentAssigned', { name: selectedChain?.name || '' }));
    } catch {
      setError(t('environment.error.setInEnvironment'));
    } finally {
      setActiveStep(null);
    }
  };

  const handleDeployEnvironment = async () => {
    if (!selectedState || !selectedChain) return;
    if (!isChainAdded) {
      setError(t('environment.chainNotAdded', { name: selectedChain.name }));
      return;
    }

    setActiveStep('environment');
    setError(undefined);
    setSuccess(undefined);

    try {
      const environmentAddress = await deployFungibleEnvironment(selectedChain.rpcUrl);
      if (!environmentAddress) {
        setError(t('environment.error.deployEnvironment'));
        return;
      }

      const newState = { ...selectedState };
      newState.fungibleEnvironment = {
        address: environmentAddress,
        deployed: true,
        assigned: false,
      };

      updateChainFungibleEnvironment(selectedChainId, environmentAddress);

      setChainStates(prev =>
        prev.map(c => (c.chainId === selectedChainId ? newState : c))
      );

      eventBus.emit('environment:environment-deployed', {
        chainId: selectedChainId,
        chainName: selectedChain?.name,
        timestamp: Date.now(),
      });

      setSuccess(t('environment.success.environmentDeployed', { name: selectedChain?.name || '' }));
    } catch {
      setError(t('environment.error.deployEnvironment'));
    } finally {
      setActiveStep(null);
    }
  };

  const handleAddPaymentToken = (name: string, address: string) => {
    if (!selectedChain) return;
    const existing = selectedChain.PaymentTokens ?? {};
    const updated = {
      ...existing,
      [name]: { name, address },
    };
    updateChainPaymentTokens(selectedChainId, updated);
    setSuccess(t('environment.success.paymentTokenAdded', { name: selectedChain.name }));
  };

  const handleRemovePaymentToken = (name: string) => {
    if (!selectedChain) return;
    const existing = selectedChain.PaymentTokens ?? {};
    const { [name]: _removed, ...rest } = existing;
    void _removed;
    updateChainPaymentTokens(selectedChainId, rest);
    setSuccess(t('environment.success.paymentTokenRemoved', { name: selectedChain.name }));
  };

  const handleAddRelayer = (name: string, address: string) => {
    if (!selectedChain) return;
    const existing = selectedChain.Relayers ?? {};
    const updated = {
      ...existing,
      [name]: { name, address },
    };
    updateChainRelayers(selectedChainId, updated);
    setSuccess(t('environment.success.relayerAdded', { name: selectedChain.name }));
  };

  const handleRemoveRelayer = (name: string) => {
    if (!selectedChain) return;
    const existing = selectedChain.Relayers ?? {};
    const { [name]: _removed, ...rest } = existing;
    void _removed;
    updateChainRelayers(selectedChainId, rest);
    setSuccess(t('environment.success.relayerRemoved', { name: selectedChain.name }));
  };

  const handleAddExchange = (name: string, address: string) => {
    if (!selectedChain) return;
    const existing = selectedChain.Exchanges ?? {};
    const updated = {
      ...existing,
      [name]: { name, address },
    };
    updateChainExchanges(selectedChainId, updated);
    setSuccess(t('environment.success.exchangeAdded', { name: selectedChain.name }));
  };

  const handleRemoveExchange = (name: string) => {
    if (!selectedChain) return;
    const existing = selectedChain.Exchanges ?? {};
    const { [name]: _removed, ...rest } = existing;
    void _removed;
    updateChainExchanges(selectedChainId, rest);
    setSuccess(t('environment.success.exchangeRemoved', { name: selectedChain.name }));
  };

  const handleAddLender = (name: string, address: string) => {
    if (!selectedChain) return;
    const existing = selectedChain.Lenders ?? {};
    const updated = {
      ...existing,
      [name]: { name, address },
    };
    updateChainLenders(selectedChainId, updated);
    setSuccess(t('environment.success.lenderAdded', { name: selectedChain.name }));
  };

  const handleRemoveLender = (name: string) => {
    if (!selectedChain) return;
    const existing = selectedChain.Lenders ?? {};
    const { [name]: _removed, ...rest } = existing;
    void _removed;
    updateChainLenders(selectedChainId, rest);
    setSuccess(t('environment.success.lenderRemoved', { name: selectedChain.name }));
  };

  if (!selectedState || !selectedChain) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('environment.title', { name: selectedChain.name })}</h1>
        <p className="text-muted mt-1">
          {t('environment.subtitle')}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm flex-1">{error}</p>
          <button
            onClick={() => setError(undefined)}
            className="text-red-400 hover:text-red-600 flex-shrink-0"
            aria-label={t('common.close')}
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm flex-1">{success}</p>
          <button
            onClick={() => setSuccess(undefined)}
            className="text-green-400 hover:text-green-600 flex-shrink-0"
            aria-label={t('common.close')}
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {selectedChain && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Network className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {t('environment.chainHeader', { name: selectedChain.name, id: selectedChain.id })}
              </h2>
              <p className="text-sm text-muted">
                {selectedChain.rpcUrl}
              </p>
            </div>
          </div>

          {!isChainAdded && selectedChain && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-800">
                  {t('environment.chainNotAdded', { name: selectedChain.name })}
                </p>
                <button
                  onClick={() => { void handleAddChain(); }}
                  disabled={isAddingChain}
                  className="mt-1 text-sm font-medium text-amber-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingChain
                    ? t('environment.addingChain')
                    : t('environment.addChainToWallet')}
                </button>
                {addChainError && (
                  <p className="mt-1 text-xs text-red-600">{addChainError}</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <TokenDeployment
              state={selectedState}
              onDeploy={() => { void handleDeployToken(); }}
              isLoading={activeStep === 'token' || isDeployingCreate2}
              explorer={explorer}
              chainAdded={isChainAdded}
            />

            <FungibleProxyDeployment
              state={selectedState}
              create2Salt={form.create2Salt}
              setCreate2Salt={v => setForm({ ...form, create2Salt: v })}
              onDeploy={() => { void handleDeployProxy(); }}
              isLoading={activeStep === 'proxy' || isDeployingProxy}
              explorer={explorer}
              factories={availableFactories}
              selectedFactory={form.selectedCreate2Factory}
              setSelectedFactory={v => setForm({ ...form, selectedCreate2Factory: v })}
            />

            <FungibleEnvironmentDeployment
              state={selectedState}
              onDeploy={() => { void handleDeployEnvironment(); }}
              onSetInEnvironment={() => { void handleSetInEnvironment(); }}
              isDeploying={activeStep === 'environment' || isDeployingEnvironment}
              isSetInLoading={activeStep === 'setInEnvironment'}
              explorer={explorer}
            />
          </div>

          <PaymentTokens
            tokens={selectedChain.PaymentTokens ?? {}}
            explorer={explorer}
            onAdd={handleAddPaymentToken}
            onRemove={handleRemovePaymentToken}
          />

          <Relayers
            relayers={selectedChain.Relayers ?? {}}
            explorer={explorer}
            onAdd={handleAddRelayer}
            onRemove={handleRemoveRelayer}
          />

          <Exchanges
            exchanges={selectedChain.Exchanges ?? {}}
            explorer={explorer}
            onAdd={handleAddExchange}
            onRemove={handleRemoveExchange}
          />

          <Lenders
            lenders={selectedChain.Lenders ?? {}}
            explorer={explorer}
            onAdd={handleAddLender}
            onRemove={handleRemoveLender}
          />

          <FungibleFactoryDeployment
            state={selectedState}
            onDeploy={() => { void handleDeployFactory(); }}
            onSetInFactory={() => { void handleSetInFactory(); }}
            isDeploying={activeStep === 'factory' || isDeployingFactory}
            isSetInLoading={activeStep === 'setInFactory'}
            explorer={explorer}
          />
        </div>
      )}
    </div>
  );
}
