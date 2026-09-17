import { useState, useEffect } from 'react';
import { api } from '../api';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  Code2,
  Eye,
  Copy,
  Check,
  AlertCircle,
  Wand2,
  Sparkles,
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: page?.name || '',
    slug: page?.slug || '',
    title: page?.title || '',
    description: page?.description || '',
    route: page?.route || '',
    layout_type: page?.layout_type || 'scroll',
    components: page?.components || [],
  });

  const [jsonCode, setJsonCode] = useState<string>(
    JSON.stringify(page?.components || [], null, 2)
  );

  const [saving, setSaving] = useState(false);

  // Sync visual components into jsonCode when switching to code tab
  useEffect(() => {
    if (activeTab === 'code') {
      setJsonCode(JSON.stringify(form.components, null, 2));
      setJsonError(null);
    }
  }, [activeTab]);

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
    const updated = [...form.components, newComp];
    updateField('components', updated);
    setJsonCode(JSON.stringify(updated, null, 2));
  };

  const removeComponent = (index: number) => {
    const updated = form.components.filter((_: any, i: number) => i !== index);
    const reordered = updated.map((c: any, i: number) => ({ ...c, order: i + 1 }));
    updateField('components', reordered);
    setJsonCode(JSON.stringify(reordered, null, 2));
  };

  const updateComponentProp = (index: number, key: string, value: any) => {
    const updated = [...form.components];
    updated[index] = { ...updated[index], props: { ...updated[index].props, [key]: value } };
    updateField('components', updated);
    setJsonCode(JSON.stringify(updated, null, 2));
  };

  // Handle raw code input in Code Mode
  const handleCodeChange = (text: string) => {
    setJsonCode(text);
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        updateField('components', parsed);
        setJsonError(null);
      } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.components)) {
        // If user pasted full page object
        if (parsed.name && !form.name) updateField('name', parsed.name);
        if (parsed.slug && !form.slug) updateField('slug', parsed.slug);
        if (parsed.title && !form.title) updateField('title', parsed.title);
        if (parsed.route && !form.route) updateField('route', parsed.route);
        if (parsed.layout_type) updateField('layout_type', parsed.layout_type);
        updateField('components', parsed.components);
        setJsonError(null);
      } else {
        setJsonError('JSON must be an array of components: [ { "type": "banner", ... } ]');
      }
    } catch (e: any) {
      setJsonError(e.message || 'Invalid JSON syntax');
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonCode);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonCode(formatted);
      setJsonError(null);
    } catch (e: any) {
      alert('Cannot format invalid JSON: ' + e.message);
    }
  };

  const copyJson = () => {
    navigator.clipboard.writeText(jsonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert basic React Native JSX snippet into Server-Driven Components
  const convertJsxSnippet = () => {
    const input = prompt('Paste React Native JSX code snippet (e.g. <Text>Hello</Text> or <Image source={{uri: "..."}} />):');
    if (!input || !input.trim()) return;

    const newComponents: any[] = [];
    const textMatches = input.matchAll(/<Text[^>]*>(.*?)<\/Text>/gs);
    for (const match of textMatches) {
      newComponents.push({
        id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'text',
        order: form.components.length + newComponents.length + 1,
        props: { text: match[1].trim() },
        visibility: { visible: true },
      });
    }

    const imageMatches = input.matchAll(/<Image[^>]*source=\{\{\s*uri:\s*["']([^"']+)["']\s*\}\}[^>]*\/>/gs);
    for (const match of imageMatches) {
      newComponents.push({
        id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'image',
        order: form.components.length + newComponents.length + 1,
        props: { src: match[1].trim() },
        visibility: { visible: true },
      });
    }

    const buttonMatches = input.matchAll(/<Button[^>]*title=["']([^"']+)["'][^>]*\/>/gs);
    for (const match of buttonMatches) {
      newComponents.push({
        id: `button_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'button',
        order: form.components.length + newComponents.length + 1,
        props: { label: match[1].trim() },
        visibility: { visible: true },
      });
    }

    if (newComponents.length > 0) {
      const merged = [...form.components, ...newComponents];
      updateField('components', merged);
      setJsonCode(JSON.stringify(merged, null, 2));
      alert(`Successfully parsed and imported ${newComponents.length} components from JSX!`);
    } else {
      alert('Could not find supported JSX elements (<Text>, <Image>, <Button>). Try pasting standard JSON in the Code Editor instead.');
    }
  };

  const save = async () => {
    if (!form.name || !form.slug) {
      alert('Please enter a Page Name and Slug before saving.');
      return;
    }

    if (jsonError && activeTab === 'code') {
      alert('Please fix the JSON errors before saving: ' + jsonError);
      return;
    }

    setSaving(true);
    try {
      if (page) {
        await api.put(`/admin/pages/${page.id}`, form);
      } else {
        await api.post('/admin/pages/', form);
      }
      onSaved();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            {page ? `Edit Page: ${page.title || page.name}` : 'New Server-Driven Page'}
          </h2>
          <p className="text-sm text-gray-500">
            {page ? 'Modify existing components, layout, or copy-paste code directly.' : 'Configure page attributes and components.'}
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shadow-sm"
        >
          {saving ? 'Saving...' : 'Save Page'}
        </button>
      </div>

      {/* Page Metadata Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Page Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Events Listing"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (used by Mobile API)</label>
            <input
              value={form.slug}
              onChange={e => updateField('slug', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. events"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title (Display)</label>
            <input
              value={form.title}
              onChange={e => updateField('title', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Events"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
            <input
              value={form.route}
              onChange={e => updateField('route', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. /events"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              value={form.description}
              onChange={e => updateField('description', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Brief description of this screen..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Layout Type</label>
            <select
              value={form.layout_type}
              onChange={e => updateField('layout_type', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              {LAYOUT_TYPES.map(lt => <option key={lt} value={lt}>{lt}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Component Management Section with Dual Mode (Visual & Code) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">Components Configuration</h3>
            <p className="text-xs text-gray-500">
              Build visually or copy-paste raw component JSON & React Native templates.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 p-1 rounded-lg flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('visual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'visual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Eye size={14} /> Visual Builder
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'code'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Code2 size={14} /> Code / JSON Editor
              </button>
            </div>

            {/* In Visual Mode: Add Component Dropdown */}
            {activeTab === 'visual' && (
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
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
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
            )}
          </div>
        </div>

        {/* Tab 1: Visual Mode */}
        {activeTab === 'visual' && (
          <div>
            {form.components.length === 0 ? (
              <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-xl">
                <p className="text-base font-medium text-gray-600">No components on this page yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Click <strong>"Add Component"</strong> above, or switch to <strong>"Code / JSON Editor"</strong> to paste your component code!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {form.components.map((comp: any, index: number) => (
                  <div key={comp.id || index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <GripVertical size={18} className="text-gray-400 mt-1 cursor-grab" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          #{comp.order || index + 1}
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold uppercase">
                            {comp.type}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">id: {comp.id}</span>
                        </span>
                        <button onClick={() => removeComponent(index)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Component Props Inputs */}
                      {(comp.type === 'text' || comp.type === 'heading') && (
                        <input
                          value={comp.props?.text || ''}
                          onChange={e => updateComponentProp(index, 'text', e.target.value)}
                          placeholder="Enter text or heading content..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                        />
                      )}
                      {comp.type === 'image' && (
                        <input
                          value={comp.props?.src || ''}
                          onChange={e => updateComponentProp(index, 'src', e.target.value)}
                          placeholder="Image URL (e.g. https://...)"
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                        />
                      )}
                      {comp.type === 'banner' && (
                        <div className="space-y-2">
                          <input
                            value={comp.props?.title || ''}
                            onChange={e => updateComponentProp(index, 'title', e.target.value)}
                            placeholder="Banner Title..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          />
                          <input
                            value={comp.props?.subtitle || ''}
                            onChange={e => updateComponentProp(index, 'subtitle', e.target.value)}
                            placeholder="Banner Subtitle..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          />
                          <input
                            value={comp.props?.image || ''}
                            onChange={e => updateComponentProp(index, 'image', e.target.value)}
                            placeholder="Banner Image URL..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          />
                        </div>
                      )}
                      {comp.type === 'card' && (
                        <div className="space-y-2">
                          <input
                            value={comp.props?.title || ''}
                            onChange={e => updateComponentProp(index, 'title', e.target.value)}
                            placeholder="Card Title..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          />
                          <input
                            value={comp.props?.subtitle || ''}
                            onChange={e => updateComponentProp(index, 'subtitle', e.target.value)}
                            placeholder="Card Subtitle..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          />
                          <input
                            value={comp.props?.description || ''}
                            onChange={e => updateComponentProp(index, 'description', e.target.value)}
                            placeholder="Card Description..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          />
                          <input
                            value={comp.props?.image || ''}
                            onChange={e => updateComponentProp(index, 'image', e.target.value)}
                            placeholder="Card Image URL..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          />
                        </div>
                      )}
                      {comp.type === 'button' && (
                        <div className="space-y-2">
                          <input
                            value={comp.props?.label || ''}
                            onChange={e => updateComponentProp(index, 'label', e.target.value)}
                            placeholder="Button label..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          />
                        </div>
                      )}
                      {comp.type === 'form' && (
                        <input
                          value={comp.props?.form_slug || ''}
                          onChange={e => updateComponentProp(index, 'form_slug', e.target.value)}
                          placeholder="Form Slug (e.g. member_registration)..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Code / JSON Editor Mode */}
        {activeTab === 'code' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-900 text-gray-200 px-4 py-2.5 rounded-t-xl text-xs font-mono">
              <div className="flex items-center gap-2">
                <Code2 size={15} className="text-blue-400" />
                <span>components.json</span>
                {jsonError ? (
                  <span className="flex items-center gap-1 bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-800">
                    <AlertCircle size={12} /> Syntax Error
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                    <Check size={12} /> Valid JSON ({form.components.length} components)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={convertJsxSnippet}
                  className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-yellow-300 px-2.5 py-1 rounded transition-colors"
                  title="Paste React Native JSX (<Text>, <Image>, <Button>) to convert to components"
                >
                  <Sparkles size={12} /> Import JSX
                </button>
                <button
                  type="button"
                  onClick={formatJson}
                  className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded transition-colors"
                >
                  <Wand2 size={12} /> Format
                </button>
                <button
                  type="button"
                  onClick={copyJson}
                  className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded transition-colors"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <textarea
              value={jsonCode}
              onChange={e => handleCodeChange(e.target.value)}
              className="w-full font-mono text-xs p-4 bg-gray-950 text-gray-100 rounded-b-xl border border-gray-800 outline-none focus:ring-2 focus:ring-blue-500 h-96 leading-relaxed"
              placeholder='[
  {
    "id": "banner_1",
    "type": "banner",
    "order": 1,
    "props": {
      "title": "Welcome",
      "subtitle": "Discover experiences"
    }
  }
]'
              spellCheck={false}
            />

            {jsonError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{jsonError}</span>
              </div>
            )}

            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs flex items-center justify-between">
              <span>
                💡 <strong>Tip:</strong> You can copy and paste raw component arrays directly here. Any edits in this code editor immediately sync with the <strong>Visual Builder</strong> tab and will be saved to your page!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
