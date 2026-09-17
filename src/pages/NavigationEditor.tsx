import { useState, useEffect } from 'react';
import { api } from '../api';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface NavigationEditorProps {
  nav: any | null;
  onClose: () => void;
  onSaved: () => void;
}

const NAV_TYPES = ['bottom_tabs', 'drawer', 'stack', 'menu'];
const COMMON_ICONS = ['home', 'calendar', 'user', 'bell', 'search', 'settings', 'list', 'grid', 'bookmark', 'heart'];

export default function NavigationEditor({ nav, onClose, onSaved }: NavigationEditorProps) {
  const [navData, setNavData] = useState({
    name: nav?.name || '',
    slug: nav?.slug || '',
    nav_type: nav?.nav_type || 'bottom_tabs',
    is_active: nav?.is_active || false,
    items: nav?.items || [],
  });
  const [availablePages, setAvailablePages] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/pages/').then(res => {
      setAvailablePages(res.data.data || []);
    }).catch(console.error);
  }, []);

  const updateField = (key: string, value: any) => {
    setNavData(prev => ({ ...prev, [key]: value }));
  };

  const addItem = () => {
    const newItem = {
      title: `Item ${navData.items.length + 1}`,
      icon: 'home',
      page: availablePages.length > 0 ? availablePages[0].slug : 'home',
      badge: '',
    };
    updateField('items', [...navData.items, newItem]);
  };

  const removeItem = (index: number) => {
    updateField('items', navData.items.filter((_: any, i: number) => i !== index));
  };

  const updateItemProp = (index: number, key: string, value: any) => {
    const updated = [...navData.items];
    updated[index] = { ...updated[index], [key]: value };
    updateField('items', updated);
  };

  const save = async () => {
    if (!navData.name || !navData.slug) {
      alert('Please provide at least a Navigation Name and Slug.');
      return;
    }

    setSaving(true);
    try {
      if (nav) {
        await api.put(`/admin/navigation/${nav.id}`, navData);
      } else {
        await api.post('/admin/navigation/', navData);
      }
      onSaved();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to save navigation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            {nav ? 'Edit Navigation' : 'New Navigation Configuration'}
          </h2>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Navigation'}
        </button>
      </div>

      {/* Basic Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Navigation Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={navData.name}
              onChange={e => updateField('name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Main Bottom Tabs"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (unique)</label>
            <input
              value={navData.slug}
              onChange={e => updateField('slug', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. main_bottom_tabs"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Navigation Pattern</label>
            <select
              value={navData.nav_type}
              onChange={e => updateField('nav_type', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {NAV_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="is_active_check"
              checked={navData.is_active}
              onChange={e => updateField('is_active', e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active_check" className="text-sm font-medium text-gray-700">
              Set as Active on Mobile App
            </label>
          </div>
        </div>
      </div>

      {/* Navigation Items Builder */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Menu / Tab Items</h3>
            <p className="text-sm text-gray-500">Add tabs or drawer destinations that link to server-driven pages.</p>
          </div>
          <button
            onClick={addItem}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 text-sm transition-colors"
          >
            <Plus size={16} /> Add Tab / Item
          </button>
        </div>

        {navData.items.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No items in this navigation yet. Click "Add Tab / Item" to configure.
          </div>
        ) : (
          <div className="space-y-4">
            {navData.items.map((item: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Item #{index + 1}
                  </span>
                  <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1">
                    <Trash2 size={14} /> Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Display Title</label>
                    <input
                      value={item.title}
                      onChange={e => updateItemProp(index, 'title', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                      placeholder="e.g. Home"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Icon Name</label>
                    <input
                      list={`icons_${index}`}
                      value={item.icon}
                      onChange={e => updateItemProp(index, 'icon', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                      placeholder="e.g. home"
                    />
                    <datalist id={`icons_${index}`}>
                      {COMMON_ICONS.map(ic => <option key={ic} value={ic} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Target Page (Slug)</label>
                    {availablePages.length > 0 ? (
                      <select
                        value={item.page}
                        onChange={e => updateItemProp(index, 'page', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white"
                      >
                        {availablePages.map(p => (
                          <option key={p.slug} value={p.slug}>
                            {p.title || p.name} ({p.slug})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={item.page}
                        onChange={e => updateItemProp(index, 'page', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                        placeholder="e.g. home"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Badge (optional)</label>
                    <input
                      value={item.badge || ''}
                      onChange={e => updateItemProp(index, 'badge', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                      placeholder="e.g. New or 3"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

