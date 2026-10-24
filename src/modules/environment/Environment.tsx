import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useChains, useChainId } from 'wagmi';
import {
  Network,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Wifi,
  WifiOff,
  HelpCircle,
} from 'lucide-react';
import {
  EnvironmentChainState,
} from './types';
import { eventBus } from '../../core/EventBus';
import mockChains from '@data/chains';
import { useCreate2Deploy } from './hooks/useCreate2Deploy';
import { useDeployFungibleFactory } from './hooks/useDeployFungibleFactory';
import { useDeployFungibleEnvironment } from './hooks/useDeployFungibleEnvironment';
import { useSetFungibleFactory } from './hooks/useSetFungibleFactory';
import { useAddChain } from './hooks/useAddChain';
import { useChainHealth } from './hooks/useChainHealth';
import { useChainStore, type ChainJson, type Exchange } from '../chains/ChainStore';
import type { ChainHealthStatus } from '../chains/chainHealth';
import { isChainUnreachable, classifyRpcFailure, type RpcFailure } from '../chains/rpcErrors';

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

function NodeStatusBadge({
  status,
  isChecking,
  onRecheck,
}: {
  status: ChainHealthStatus;
  isChecking: boolean;
  onRecheck: () => void;
}) {
  const { t } = useTranslation();

  if (isChecking) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted bg-gray-50 px-2.5 py-1 rounded-full">
        <Loader2 className="h-3 w-3 animate-spin" />
        {t('environment.checkingNode')}
      </span>
    );
  }

  if (status === 'online') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
        <Wifi className="h-3 w-3" />
        {t('environment.nodeOnline')}
      </span>
    );
  }

  if (status === 'offline') {
    return (
      <button
        onClick={onRecheck}
        className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full hover:bg-red-100"
        title={t('environment.retryNodeCheck')}
      >
        <WifiOff className="h-3 w-3" />
        {t('environment.nodeOfflineBadge')}
      </button>
    );
  }

  if (status === 'mismatch') {
    return (
      <button
        onClick={onRecheck}
        className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full hover:bg-amber-100"
        title={t('environment.retryNodeCheck')}
      >
        <AlertTriangle className="h-3 w-3" />
        {t('environment.nodeMismatchBadge')}
      </button>
    );
  }

  return (
    <button
      onClick={onRecheck}
      className="flex items-center gap-1.5 text-xs font-medium text-muted bg-gray-50 px-2.5 py-1 rounded-full hover:bg-gray-100"
      title={t('environment.retryNodeCheck')}
    >
      <HelpCircle className="h-3 w-3" />
      {t('environment.nodeUnknown')}
    </button>
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

function FungibleFactoryDeployment({
  state,
  create2Salt,
  setCreate2Salt,
  onDeploy,
  onSetInFactory,
  isDeploying,
  isSetInLoading,
  explorer,
  factories,
  selectedFactory,
  setSelectedFactory,
}: {
  state: EnvironmentChainState;
  create2Salt: string;
  setCreate2Salt: (value: string) => void;
  onDeploy: () => void;
  onSetInFactory: () => void;
  isDeploying: boolean;
  isSetInLoading: boolean;
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
          <Network className="h-5 w-5 text-blue-600" />
          {t('environment.fungibleFactoryContract')}
        </h3>
        <StatusBadge deployed={state.fungibleFactory.deployed} />
      </div>

      <p className="text-sm text-muted">
        {t('environment.fungibleFactoryDesc')}
      </p>

      <div>
        <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
          {t('environment.create2FactorySelect')}
        </label>
        <select
          value={selectedFactory}
          onChange={e => setSelectedFactory(e.target.value)}
          disabled={isDeploying}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white"
        >
          <option value="">{t('environment.create2FactorySelectPlaceholder')}</option>
          {factories.map(f => (
            <option key={f.address} value={f.address}>
              {f.label} - {f.address.slice(0, 10)}...{f.address.slice(-8)}
            </option>
          ))}
        </select>
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
          disabled={isDeploying}
        />
      </div>

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
              ? t('environment.assigned')
              : t('environment.notAssigned')}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 mt-auto">
        <button
          onClick={onDeploy}
          disabled={isDeploying || state.fungibleFactory.deployed}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
          disabled={isSetInLoading || !state.fungibleFactory.deployed || state.fungibleFactory.assigned || !state.fungibleEnvironment.deployed}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
  create2Salt,
  setCreate2Salt,
  onDeploy,
  isDeploying,
  explorer,
  factories,
  selectedFactory,
  setSelectedFactory,
}: {
  state: EnvironmentChainState;
  create2Salt: string;
  setCreate2Salt: (value: string) => void;
  onDeploy: () => void;
  isDeploying: boolean;
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
          <Network className="h-5 w-5 text-blue-600" />
          {t('environment.fungibleEnvironmentContract')}
        </h3>
        <StatusBadge deployed={state.fungibleEnvironment.deployed} />
      </div>

      <p className="text-sm text-muted">
        {t('environment.fungibleEnvironmentDesc')}
      </p>

      <div>
        <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
          {t('environment.create2FactorySelect')}
        </label>
        <select
          value={selectedFactory}
          onChange={e => setSelectedFactory(e.target.value)}
          disabled={isDeploying}
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
          disabled={isDeploying}
        />
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <AddressRow
          address={state.fungibleEnvironment.address}
          deployed={state.fungibleEnvironment.deployed}
          showExplorer={!!explorer}
          explorer={explorer}
        />
      </div>

      <div className="flex flex-wrap justify-end gap-2 mt-auto">
        <button
          onClick={onDeploy}
          disabled={isDeploying || state.fungibleEnvironment.deployed || !selectedFactory || !create2Salt}
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
      </div>
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
          <Network className="h-5 w-5 text-green-600" />
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
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
            className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
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
  exchanges: Record<string, Exchange>;
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
          <Network className="h-5 w-5 text-green-600" />
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
            const ex = exchange as unknown as Record<string, unknown>;
            const addr = (ex.address as string | undefined) || (ex.factory as string | undefined) || (ex.router as string | undefined) || (ex.factorys as string | undefined) || '';
            if (!addr || typeof addr !== 'string' || addr.length === 0) {
              return null;
            }
            const name = (ex.name as string | undefined) || key;
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
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
            className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
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

export function Environment() {
  const { t } = useTranslation();
  const [chainStates, setChainStates] = useState<EnvironmentChainState[]>([]);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const { selectedChainId, selectedChain, selectChain, updateChainCreate2Factory, updateChainFungibleFactory, updateChainFungibleEnvironment, updateChainRelayers, updateChainExchanges, chainCache } = useChainStore();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [form, setForm] = useState({
    tokenAddress: '',
    useCreate2: true,
    fungibleEnvironmentSalt: 'fungible-environment-1',
    fungibleFactorySalt: 'fungible-factory-1',
    selectedCreate2Factory: '',
  });
  const environmentInitializedRef = useRef(false);

  const { deployCreate2Factory, isDeploying: isDeployingCreate2 } = useCreate2Deploy();
  const { deployFungibleFactory, isDeploying: isDeployingFactory } = useDeployFungibleFactory();
  const { deployFungibleEnvironment, isDeploying: isDeployingEnvironment } = useDeployFungibleEnvironment();
  const { setFungibleFactory, isAssigning: isAssigningFactory } = useSetFungibleFactory();

  const reportFailure = (failure: RpcFailure, fallbackKey: string) => {
    const chainName = selectedChain?.name ?? '';
    if (isChainUnreachable(failure)) {
      setError(t('environment.error.chainUnreachable', { name: chainName }));
      eventBus.emit('chain:unreachable', {
        chainId: selectedChainId,
        chainName,
        rpcUrl: selectedChain?.rpcUrl,
        reason: failure.kind,
        message: failure.message,
        timestamp: Date.now(),
      });
      return;
    }
    switch (failure.kind) {
      case 'user_rejected':
        setError(t('environment.error.userRejected'));
        return;
      case 'rate_limited':
        setError(t('environment.error.rateLimited', { name: chainName }));
        return;
      case 'contract_reverted':
        setError(t('environment.error.contractReverted'));
        return;
      default:
        setError(t(fallbackKey));
    }
  };

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
    fungibleFactory: { address: factoryAddress, deployed: !!factoryAddress, assigned: !!factoryAddress },
    fungibleEnvironment: { address: environmentAddress, deployed: !!environmentAddress },
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

  const { health: nodeHealth, isChecking: isCheckingNode, check: checkNode } =
    useChainHealth(selectedChain?.rpcUrl, selectedChain?.id);

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
      const outcome = await deployCreate2Factory(selectedChain.rpcUrl);
      if (!outcome.ok) {
        reportFailure(outcome.failure, 'environment.error.deployToken');
        return;
      }
      const factoryAddress = outcome.address;

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
      setForm({ tokenAddress: '', useCreate2: true, fungibleEnvironmentSalt: 'fungible-environment-1', fungibleFactorySalt: 'fungible-factory-1', selectedCreate2Factory: '' });
    } catch (error) {
      reportFailure(classifyRpcFailure(error), 'environment.error.deployToken');
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
      const outcome = await deployFungibleFactory(selectedChain.rpcUrl);
      if (!outcome.ok) {
        reportFailure(outcome.failure, 'environment.error.deployFactory');
        return;
      }
      const factoryAddress = outcome.address;

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
    } catch (error) {
      reportFailure(classifyRpcFailure(error), 'environment.error.deployFactory');
    } finally {
      setActiveStep(null);
    }
  };

  const handleSetInFactory = async () => {
    if (!selectedState || !selectedChain) return;
    if (!selectedState.fungibleFactory.deployed) return;

    const environmentAddress = selectedState.fungibleEnvironment.address;
    const factoryAddress = selectedState.fungibleFactory.address;
    if (!environmentAddress) {
      setError(t('environment.error.environmentNotDeployed'));
      return;
    }
    if (!factoryAddress) return;

    setActiveStep('setInFactory');
    setError(undefined);
    setSuccess(undefined);

    try {
      const outcome = await setFungibleFactory({
        rpcUrl: selectedChain.rpcUrl,
        environmentAddress,
        factoryAddress,
      });
      if (!outcome.ok) {
        reportFailure(outcome.failure, 'environment.error.setInFactory');
        return;
      }

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
    } catch (error) {
      reportFailure(classifyRpcFailure(error), 'environment.error.setInFactory');
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

    const factoryAddress = form.selectedCreate2Factory;
    const salt = form.fungibleEnvironmentSalt;
    if (!factoryAddress || !salt) {
      setError(t('environment.error.create2FactoryRequired'));
      return;
    }

    setActiveStep('environment');
    setError(undefined);
    setSuccess(undefined);

    try {
      const outcome = await deployFungibleEnvironment({
        rpcUrl: selectedChain.rpcUrl,
        factoryAddress,
        salt,
      });
      if (!outcome.ok) {
        reportFailure(outcome.failure, 'environment.error.deployEnvironment');
        return;
      }
      const environmentAddress = outcome.address;

      const newState = { ...selectedState };
      newState.fungibleEnvironment = {
        address: environmentAddress,
        deployed: true,
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
    } catch (error) {
      reportFailure(classifyRpcFailure(error), 'environment.error.deployEnvironment');
    } finally {
      setActiveStep(null);
    }
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
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-foreground">
                {t('environment.chainHeader', { name: selectedChain.name, id: selectedChain.id })}
              </h2>
              <p className="text-sm text-muted">
                {selectedChain.rpcUrl}
              </p>
            </div>
            <NodeStatusBadge
              status={nodeHealth?.status ?? 'unknown'}
              isChecking={isCheckingNode}
              onRecheck={checkNode}
            />
          </div>

          {nodeHealth?.status === 'offline' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <WifiOff className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">
                  {t('environment.nodeOffline', { name: selectedChain.name, url: selectedChain.rpcUrl })}
                </p>
                {nodeHealth.failure?.message && (
                  <p className="mt-1 text-xs text-red-600 font-mono break-words">
                    {nodeHealth.failure.message}
                  </p>
                )}
                <button
                  onClick={checkNode}
                  disabled={isCheckingNode}
                  className="mt-2 text-sm font-medium text-red-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingNode ? t('environment.checkingNode') : t('environment.retryNodeCheck')}
                </button>
              </div>
            </div>
          )}

          {nodeHealth?.status === 'mismatch' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-800">
                  {t('environment.nodeMismatch', {
                    name: selectedChain.name,
                    url: selectedChain.rpcUrl,
                    expected: nodeHealth.expectedChainId ?? '',
                    actual: nodeHealth.chainId ?? '',
                  })}
                </p>
                <button
                  onClick={checkNode}
                  disabled={isCheckingNode}
                  className="mt-2 text-sm font-medium text-amber-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingNode ? t('environment.checkingNode') : t('environment.retryNodeCheck')}
                </button>
              </div>
            </div>
          )}

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

<FungibleEnvironmentDeployment
              state={selectedState}
              create2Salt={form.fungibleEnvironmentSalt}
              setCreate2Salt={v => setForm({ ...form, fungibleEnvironmentSalt: v })}
              onDeploy={() => { void handleDeployEnvironment(); }}
              isDeploying={activeStep === 'environment' || isDeployingEnvironment}
              explorer={explorer}
              factories={availableFactories}
              selectedFactory={form.selectedCreate2Factory}
              setSelectedFactory={v => setForm({ ...form, selectedCreate2Factory: v })}
            />

            <FungibleFactoryDeployment
              state={selectedState}
              create2Salt={form.fungibleFactorySalt}
              setCreate2Salt={v => setForm({ ...form, fungibleFactorySalt: v })}
              onDeploy={() => { void handleDeployFactory(); }}
              onSetInFactory={() => { void handleSetInFactory(); }}
              isDeploying={activeStep === 'factory' || isDeployingFactory}
              isSetInLoading={activeStep === 'setInFactory' || isAssigningFactory}
              explorer={explorer}
              factories={availableFactories}
              selectedFactory={form.selectedCreate2Factory}
              setSelectedFactory={v => setForm({ ...form, selectedCreate2Factory: v })}
            />
          </div>

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

          </div>
      )}
    </div>
  );
}
