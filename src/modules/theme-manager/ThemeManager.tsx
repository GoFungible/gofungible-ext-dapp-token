import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../components/ThemeProvider';
import { coreFramework } from '../../core/CoreFramework';
import { moduleLoader } from '../../core/ModuleLoader';
import { Check, Trash2, FolderOpen, Globe, File, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export function ThemeManager() {
  const { t } = useTranslation();
  const { themes, activeTheme, setActiveTheme } = useTheme();
  const [importMode, setImportMode] = useState<'file' | 'zip' | 'url'>('file');
  const [fileRef, setFileRef] = useState<HTMLInputElement | null>(null);
  const [zipRef, setZipRef] = useState<HTMLInputElement | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleImport = async (run: () => Promise<void>) => {
    setLoading(true);
    setResult(null);
    try {
      await run();
      setResult({ success: true, message: t('themeManager.importSuccess') });
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : t('themeManager.importError') });
    } finally {
      setLoading(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    void handleImport(async () => {
      await moduleLoader.loadFromFile(file);
    });
    if (fileRef) fileRef.value = '';
  };

  const handleZipImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    void handleImport(async () => {
      await moduleLoader.loadFromZip(file);
    });
    if (zipRef) zipRef.value = '';
  };

  const handleUrlImport = () => {
    if (!urlInput.trim()) return;
    void handleImport(async () => {
      await moduleLoader.loadFromUrl(urlInput.trim());
      setUrlInput('');
    });
  };

  const handleRemove = (themeId: string) => {
    if (themeId === 'default') return;
    const mod = coreFramework.getAllModules().find(m => m.manifest.theme?.id === themeId);
    if (mod) {
      coreFramework.unregisterModule(mod.manifest.id);
    }
    coreFramework.theme.unregister(themeId);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('themeManager.title')}</h1>
        <p className="text-muted mt-1">{t('themeManager.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map(theme => (
          <div key={theme.id} className="bg-surface rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{theme.name}</h3>
              {theme.id === activeTheme.id && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <Check className="h-3 w-3" />
                  {t('themeManager.active')}
                </span>
              )}
            </div>
            <p className="text-sm text-muted">{theme.description}</p>
            <div className="flex gap-2">
              {Object.values(theme.colors).map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-md border border-gray-200" style={{ backgroundColor: c }} />
              ))}
            </div>
            <p className="text-xs text-muted">{theme.mode === 'dark' ? t('themeManager.modeDark') : t('themeManager.modeLight')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTheme(theme.id)}
                disabled={theme.id === activeTheme.id}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('themeManager.apply')}
              </button>
              <button
                onClick={() => handleRemove(theme.id)}
                disabled={theme.id === 'default'}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t('themeManager.remove')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">{t('themeManager.importTitle')}</h2>
        <div className="flex gap-2">
          {(['file', 'zip', 'url'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setImportMode(mode)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                importMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-foreground hover:bg-gray-200'
              }`}
            >
              {mode === 'file' ? t('loader.tab.file') : mode === 'zip' ? t('loader.tab.zip') : t('loader.tab.url')}
            </button>
          ))}
        </div>

        {importMode === 'file' && (
          <div>
            <input ref={setFileRef} type="file" accept=".js,.ts,.jsx,.tsx" className="hidden" id="theme-file-input" onChange={handleFileImport} />
            <label htmlFor="theme-file-input" className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50">
              <File className="h-5 w-5 text-muted" />
              <span className="text-foreground font-medium">{t('loader.file.chooseFile')}</span>
            </label>
          </div>
        )}
        {importMode === 'zip' && (
          <div>
            <input ref={setZipRef} type="file" accept=".zip" className="hidden" id="theme-zip-input" onChange={handleZipImport} />
            <label htmlFor="theme-zip-input" className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50">
              <FolderOpen className="h-5 w-5 text-muted" />
              <span className="text-foreground font-medium">{t('loader.zip.chooseZip')}</span>
            </label>
          </div>
        )}
        {importMode === 'url' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder={t('loader.url.placeholder')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
              <button
                onClick={handleUrlImport}
                disabled={loading || !urlInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className={`p-3 rounded-lg border flex items-center gap-2 ${result.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span className="text-sm">{result.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
