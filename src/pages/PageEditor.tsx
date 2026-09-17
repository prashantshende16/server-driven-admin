import { useState } from 'react';
import { api } from '../api';
import { ArrowLeft, Plus, Trash2, GripVertical, ChevronDown } from 'lucide-react';

interface PageEditorProps {
  page: any | null;
  onClose: () => void;
  onSaved: () => void;
}

const COMPONENT_TYPES = [
  'text', 'heading', 'image', 'banner', 'card', 'list', 'grid',
  'button', 'divider', 'spacer', 'form', 'carousel', 'avatar', 'badge', 'webview'
];

const LAYOUT_TYPES = ['scroll', 'stack', 'grid', 'tabs'];

export default function PageEditor({ page, onClose, onSaved }: PageEditorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [form, setForm] = useState({
    name: page?.name || '',
    slug: page?.slug || '',
    title: page?.title || '',
    description: page?.description || '',
    route: page?.route || '',
    layout_type: page?.layout_type || 'scroll',
    components: page?.components || [],
  });
  const [saving, setSaving] = useState(false);

  const updateField = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const addComponent = (type: string) => {
    const newComp = {
      id: `${type}_${Date.now()}`,
      type,
      order: form.components.length + 1,
      props: {},
      visibility: { visible: true },
      style: {},
      actions: [],
      data_source: null,
    };
    updateField('components', [...form.components, newComp]);
  };

  const removeComponent = (index: number) => {
    const updated = form.components.filter((_: any, i: number) => i !== index);
    updateField('components', updated.map((c: any, i: number) => ({ ...c, order: i + 1 })));
  };

  const updateComponentProp = (index: number, key: string, value: any) => {
    const updated = [...form.components];
    updated[index] = { ...updated[index], props: { ...updated[index].props, [key]: value } };
    updateField('components', updated);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (page) {
        await api.put(`/admin/pages/${page.id}`, form);
      } else {
        await api.post('/admin/pages/', form);
      }
      onSaved();
    } catch (e) {
      console.error(e);
      alert('Failed to save page');
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
            {page ? 'Edit Page' : 'New Page'}
          </h2>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Page'}
        </button>
      </div>

      {/* Page Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Page Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. Home Page"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              value={form.slug}
              onChange={e => updateField('slug', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. home"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              value={form.title}
              onChange={e => updateField('title', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. Home"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
            <input
              value={form.route}
              onChange={e => updateField('route', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. /home"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => updateField('description', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            rows={2}
            placeholder="Page description..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Layout Type</label>
          <select
            value={form.layout_type}
            onChange={e => updateField('layout_type', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {LAYOUT_TYPES.map(lt => <option key={lt} value={lt}>{lt}</option>)}
          </select>
        </div>
      </div>

      {/* Components */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Components</h3>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3.5 py-1.5 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
            >
              <Plus size={16} /> Add Component
              <ChevronDown size={14} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-20 max-h-80 overflow-y-auto">
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    Select Component
                  </div>
                  {COMPONENT_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        addComponent(type);
                        setShowDropdown(false);
                      }}
                      className="flex items-center justify-between w-full text-left px-3.5 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <span className="capitalize">{type}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono uppercase">UI</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {form.components.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No components yet. Add components to build this page.
          </div>
        ) : (
          <div className="space-y-3">
            {form.components.map((comp: any, index: number) => (
              <div key={comp.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <GripVertical size={18} className="text-gray-400 mt-1 cursor-grab" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      #{comp.order} — <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{comp.type}</span>
                    </span>
                    <button onClick={() => removeComponent(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {/* Quick prop editor */}
                  {(comp.type === 'text' || comp.type === 'heading') && (
                    <input
                      value={comp.props.text || ''}
                      onChange={e => updateComponentProp(index, 'text', e.target.value)}
                      placeholder="Enter text content..."
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    />
                  )}
                  {comp.type === 'image' && (
                    <input
                      value={comp.props.src || ''}
                      onChange={e => updateComponentProp(index, 'src', e.target.value)}
                      placeholder="Image URL..."
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    />
                  )}
                  {comp.type === 'banner' && (
                    <div className="space-y-2">
                      <input
                        value={comp.props.title || ''}
                        onChange={e => updateComponentProp(index, 'title', e.target.value)}
                        placeholder="Banner title..."
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                      />
                      <input
                        value={comp.props.subtitle || ''}
                        onChange={e => updateComponentProp(index, 'subtitle', e.target.value)}
                        placeholder="Banner subtitle..."
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                      />
                      <input
                        value={comp.props.image || ''}
                        onChange={e => updateComponentProp(index, 'image', e.target.value)}
                        placeholder="Banner image URL..."
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                      />
                    </div>
                  )}
                  {comp.type === 'button' && (
                    <div className="space-y-2">
                      <input
                        value={comp.props.label || ''}
                        onChange={e => updateComponentProp(index, 'label', e.target.value)}
                        placeholder="Button label..."
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

