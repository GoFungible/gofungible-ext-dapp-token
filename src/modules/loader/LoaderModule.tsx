import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen, File, Globe, X, Loader2, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { moduleLoader } from '../../core/ModuleLoader';

type LoadMethod = 'file' | 'zip' | 'url';

interface LoaderModuleProps {
  onClose?: () => void;
}

export function LoaderModule({ onClose = () => {} }: LoaderModuleProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<LoadMethod>('file');
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  const [zipInputRef, setZipInputRef] = useState<HTMLInputElement | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const module = await moduleLoader.loadFromFile(file);
      setResult({ success: true, message: t('loader.success.moduleLoaded', { name: module.manifest.name }) });
      onClose();
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : t('loader.error.loadModule') });
    } finally {
      setLoading(false);
      if (fileInputRef) fileInputRef.value = '';
    }
  };

  const handleZipSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const modules = await moduleLoader.loadFromZip(file);
      setResult({ success: true, message: t('loader.success.modulesLoadedFromZip', { count: modules.length }) });
      onClose();
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : t('loader.error.loadModulesFromZip') });
    } finally {
      setLoading(false);
      if (zipInputRef) zipInputRef.value = '';
    }
  };

  const handleUrlLoad = async () => {
    if (!urlInput.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const module = await moduleLoader.loadFromUrl(urlInput.trim());
      setResult({ success: true, message: t('loader.success.moduleLoaded', { name: module.manifest.name }) });
      setUrlInput('');
      onClose();
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : t('loader.error.loadModuleFromUrl') });
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: LoadMethod; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
    { id: 'file', label: t('loader.tab.file'), icon: File, description: t('loader.tab.descFile') },
    { id: 'zip', label: t('loader.tab.zip'), icon: FolderOpen, description: t('loader.tab.descZip') },
    { id: 'url', label: t('loader.tab.url'), icon: Globe, description: t('loader.tab.descUrl') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            {t('loader.loadNewModule')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="text-center">
                <File className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">{t('loader.file.selectFile')}</p>
                <input
                  ref={setFileInputRef}
                  type="file"
                  accept=".js,.ts,.jsx,.tsx"
                  className="hidden"
                  id="file-input"
                  onChange={handleFileSelect}
                />
                <label htmlFor="file-input" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <File className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700 font-medium">{t('loader.file.chooseFile')}</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 text-center">{t('loader.file.supportedFormats')}</p>
            </div>
          )}

          {activeTab === 'zip' && (
            <div className="space-y-4">
              <div className="text-center">
                <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">{t('loader.zip.selectZip')}</p>
                <input
                  ref={setZipInputRef}
                  type="file"
                  accept=".zip"
                  className="hidden"
                  id="zip-input"
                  onChange={handleZipSelect}
                />
                <label htmlFor="zip-input" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <FolderOpen className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700 font-medium">{t('loader.zip.chooseZip')}</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 text-center">{t('loader.zip.eachJsFile')}</p>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="text-center">
                <Globe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">{t('loader.url.enterUrl')}</p>
              </div>
              <div>
                <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('loader.url.moduleUrl')}
                </label>
                <input
                  id="url-input"
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder={t('loader.url.placeholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={loading}
                />
              </div>
              <button
                onClick={handleUrlLoad}
                disabled={loading || !urlInput.trim()}
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <Globe className="h-5 w-5" />
                    {t('loader.url.loadFromUrl')}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {result && (
          <div className={`p-4 border rounded-lg ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={result.success ? 'text-green-800' : 'text-red-800'}>
                {result.message}
              </span>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
