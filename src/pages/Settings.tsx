import { useState, useEffect } from 'react';
import { api } from '../api';
import { Save, Check } from 'lucide-react';

export default function Settings() {
  const [config, setConfig] = useState({
    appName: 'FlowForge',
    minVersion: '1.0.0',
    primaryColor: '#2563eb',
    darkMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    api.get('/admin/config/')
      .then(res => {
        const data = res.data.data;
        if (data) {
          setConfig({
            appName: data.schema_version?.app_name || 'FlowForge',
            minVersion: data.schema_version?.min_version || '1.0.0',
            primaryColor: data.theme?.primary_color || '#2563eb',
            darkMode: data.theme?.dark_mode || false,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await api.put('/admin/config/', {
        schema_version: {
          app_name: config.appName,
          min_version: config.minVersion,
          version: 1,
        },
        theme: {
          primary_color: config.primaryColor,
          dark_mode: config.darkMode,
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Application Settings</h2>
          <p className="mt-1 text-gray-500">Configure global metadata, force update rules, and mobile theme.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {savedSuccess ? <Check size={18} /> : <Save size={18} />}
          {saving ? 'Saving...' : savedSuccess ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Mobile App Metadata</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Name</label>
              <input
                value={config.appName}
                onChange={e => setConfig({ ...config, appName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Supported Version</label>
              <input
                value={config.minVersion}
                onChange={e => setConfig({ ...config, minVersion: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. 1.0.0"
              />
              <span className="text-xs text-gray-400 mt-1 block">Used by mobile client for force update checks</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Mobile Theme Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand / Primary Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={e => setConfig({ ...config, primaryColor: e.target.value })}
                  className="w-10 h-10 border border-gray-300 rounded cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={config.primaryColor}
                  onChange={e => setConfig({ ...config, primaryColor: e.target.value })}
                  className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="dark_mode_check"
                checked={config.darkMode}
                onChange={e => setConfig({ ...config, darkMode: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="dark_mode_check" className="text-sm font-medium text-gray-700">
                Enable Dark Theme by Default
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

