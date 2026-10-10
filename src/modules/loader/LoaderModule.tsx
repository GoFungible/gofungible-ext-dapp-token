import React, { useState } from 'react';
import { FolderOpen, File, Globe, X, Loader2, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { moduleLoader } from '../../core/ModuleLoader';

type LoadMethod = 'file' | 'zip' | 'url';

interface LoaderModuleProps {
  onClose?: () => void;
}

export function LoaderModule({ onClose = () => {} }: LoaderModuleProps) {
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
      setResult({ success: true, message: `Module "${module.manifest.name}" loaded successfully` });
      onClose();
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : 'Failed to load module' });
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
      setResult({ success: true, message: `${modules.length} module(s) loaded from zip` });
      onClose();
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : 'Failed to load modules from zip' });
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
      setResult({ success: true, message: `Module "${module.manifest.name}" loaded successfully` });
      setUrlInput('');
      onClose();
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : 'Failed to load module from URL' });
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: LoadMethod; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
    { id: 'file', label: 'File', icon: File, description: 'Load a module JavaScript file' },
    { id: 'zip', label: 'ZIP', icon: FolderOpen, description: 'Load modules from a ZIP archive' },
    { id: 'url', label: 'URL', icon: Globe, description: 'Load a module from a remote URL' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Load New Module
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
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
                <p className="text-gray-600 mb-4">Select a module JavaScript file to load</p>
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
                  <span className="text-gray-700 font-medium">Choose File</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 text-center">Supported formats: .js, .ts, .jsx, .tsx</p>
            </div>
          )}

          {activeTab === 'zip' && (
            <div className="space-y-4">
              <div className="text-center">
                <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">Select a ZIP archive containing module files</p>
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
                  <span className="text-gray-700 font-medium">Choose ZIP File</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 text-center">Each .js file in the ZIP will be loaded as a separate module</p>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="text-center">
                <Globe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">Enter the URL of a module to load remotely</p>
              </div>
              <div>
                <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-1">
                  Module URL
                </label>
                <input
                  id="url-input"
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://example.com/module.js"
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
                    Loading...
                  </>
                ) : (
                  <>
                    <Globe className="h-5 w-5" />
                    Load from URL
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}