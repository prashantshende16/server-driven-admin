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
  X,
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [rawJsxInput, setRawJsxInput] = useState('');

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

  // Convert React Native code (JSX or data arrays) into Server-Driven Components
  const convertReactNativeToComponents = (input: string): any[] => {
    const newComponents: any[] = [];

    // 1. Extract Top Title / Headings
    const titleMatch = input.match(/headerTitle[\s\S]*?>\s*([^<]+)\s*<\/Text>/i) ||
                       input.match(/<Text[^>]*>(Event[s]?)<\/Text>/i);
    const subtitleMatch = input.match(/headerSubtitle[\s\S]*?>\s*([^<]+)\s*<\/Text>/i);
    if (titleMatch) {
      newComponents.push({
        id: `heading_${Date.now()}_1`,
        type: 'heading',
        order: newComponents.length + 1,
        props: {
          text: titleMatch[1].trim(),
          subtitle: subtitleMatch ? subtitleMatch[1].trim() : undefined,
          size: 'large',
        },
        visibility: { visible: true },
      });
    }

    // 2. Extract Banners
    const bannerTitleMatch = input.match(/bannerTitle[\s\S]*?>\s*([^<]+)\s*<\/Text>/i) ||
                             input.match(/['"](Today event)['"]/i);
    const bannerSubMatch = input.match(/bannerSubtitle[\s\S]*?>\s*([^<]+)\s*<\/Text>/i);
    const bannerImgMatch = input.match(/bannerBackground[\s\S]*?uri:\s*['"]([^'"]+)['"]/i) ||
                           input.match(/https:\/\/images\.unsplash\.com\/photo-[0-9a-zA-Z\-_?=&;]+/i);
    if (bannerTitleMatch || bannerImgMatch) {
      newComponents.push({
        id: `banner_${Date.now()}_2`,
        type: 'banner',
        order: newComponents.length + 1,
        props: {
          title: bannerTitleMatch ? (typeof bannerTitleMatch === 'string' ? bannerTitleMatch : bannerTitleMatch[1] || 'Today event') : 'Today event',
          subtitle: bannerSubMatch ? bannerSubMatch[1].trim() : 'Global Electronic Beats Festival • Live at Grand Arena',
          image: bannerImgMatch ? (typeof bannerImgMatch === 'string' ? bannerImgMatch : bannerImgMatch[1] || bannerImgMatch[0]) : '',
        },
        visibility: { visible: true },
      });
    }

    // 3. Extract Section Headers
    const sectionTitleMatch = input.match(/sectionTitle[\s\S]*?>\s*([^<]+)\s*<\/Text>/i) ||
                              input.match(/<Text[^>]*>(Event list)<\/Text>/i);
    if (sectionTitleMatch) {
      newComponents.push({
        id: `heading_${Date.now()}_3`,
        type: 'heading',
        order: newComponents.length + 1,
        props: { text: sectionTitleMatch[1].trim(), size: 'medium' },
        visibility: { visible: true },
      });
    }

    // 4. Extract data array like const EVENTS_DATA = [...]
    const arrayMatch = input.match(/const\s+[A-Za-z0-9_]+\s*=\s*(\[[\s\S]*?\]);/);
    if (arrayMatch) {
      try {
        const items = new Function("return " + arrayMatch[1])();
        if (Array.isArray(items)) {
          items.forEach((item: any, idx: number) => {
            newComponents.push({
              id: `card_${item.id || idx + 1}_${Date.now()}`,
              type: 'card',
              order: newComponents.length + 1,
              props: {
                title: item.title || item.name || 'Event Item',
                subtitle: `${item.category || ''} ${item.price ? '• ' + item.price : ''}`.trim(),
                description: `${item.date || ''} ${item.time ? '• ' + item.time : ''} ${item.location ? '• ' + item.location : ''}`.trim(),
                image: item.image || '',
              },
              visibility: { visible: true },
            });
          });
        }
      } catch (err) {
        console.warn('Could not auto-parse array:', err);
      }
    }

    // 5. Fallback generic text tags if nothing matched above
    if (newComponents.length === 0) {
      const textMatches = input.matchAll(/<Text[^>]*>(.*?)<\/Text>/gs);
      for (const match of textMatches) {
        const txt = match[1].replace(/<[^>]*>/g, '').trim();
        if (txt && !txt.includes('{')) {
          newComponents.push({
            id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            type: 'text',
            order: newComponents.length + 1,
            props: { text: txt },
            visibility: { visible: true },
          });
        }
      }
    }

    return newComponents.map((c, i) => ({ ...c, order: i + 1 }));
  };

  // Handle raw code input in Code Mode
  const handleCodeChange = (text: string) => {
    setJsonCode(text);

    // Auto-detect if user pasted React Native JavaScript code
    const isReactNative =
      text.includes('import ') ||
      text.includes('export default') ||
      text.includes('StyleSheet.create') ||
      text.includes('const EVENTS_DATA') ||
      text.includes('<FlatList');

    if (isReactNative) {
      const converted = convertReactNativeToComponents(text);
      if (converted.length > 0) {
        const formatted = JSON.stringify(converted, null, 2);
        setJsonCode(formatted);
        updateField('components', converted);
        setJsonError(null);
        return;
      }
    }

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

  const handleImportFromModal = () => {
    if (!rawJsxInput || !rawJsxInput.trim()) {
      alert('Please paste your React Native code first.');
      return;
    }
    const converted = convertReactNativeToComponents(rawJsxInput);
    if (converted.length > 0) {
      updateField('components', converted);
      setJsonCode(JSON.stringify(converted, null, 2));
      setShowImportModal(false);
      setRawJsxInput('');
      setJsonError(null);
      alert(`🎉 Successfully converted React Native code into ${converted.length} FlowForge components!`);
    } else {
      alert('Could not auto-parse React Native code. Ensure your code contains JSX tags or an array like const EVENTS_DATA = [...].');
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRawJsxInput('');
              setShowImportModal(true);
            }}
            className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 px-3.5 py-2 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm shadow-sm"
          >
            <Sparkles size={16} className="text-indigo-600" /> Import React Native Code
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Page'}
          </button>
        </div>
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
                  onClick={() => {
                    setRawJsxInput('');
                    setShowImportModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1 rounded transition-colors shadow-sm text-xs"
                  title="Open code paste window"
                >
                  <Sparkles size={13} /> Import React Native Code
                </button>
                <button
                  type="button"
                  onClick={formatJson}
                  className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded transition-colors text-xs"
                >
                  <Wand2 size={12} /> Format
                </button>
                <button
                  type="button"
                  onClick={copyJson}
                  className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded transition-colors text-xs"
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
                💡 <strong>Tip:</strong> You can click <strong>"Import React Native Code"</strong> to paste your raw React Native files, or paste raw JSON directly into the editor above.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Full Modal for Pasting Raw React Native Code */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Import React Native Code</h3>
                  <p className="text-xs text-gray-500">
                    Paste your entire React Native file (.tsx / .jsx) with arrays, headings, and banners.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleImportFromModal}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  <Sparkles size={14} /> Convert & Import to Page
                </button>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col space-y-2 overflow-y-auto">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                React Native Code Input:
              </label>
              <textarea
                value={rawJsxInput}
                onChange={e => setRawJsxInput(e.target.value)}
                placeholder="Paste your code here (import React, const EVENTS_DATA = [...], renderListHeader, etc.)..."
                className="w-full flex-1 min-h-[300px] font-mono text-xs p-4 bg-gray-950 text-gray-100 rounded-xl border border-gray-800 outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                spellCheck={false}
              />
              <p className="text-xs text-gray-400">
                Supports: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">const EVENTS_DATA = [...]</code>, banners, headings, and card lists.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportFromModal}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                <Sparkles size={15} /> Convert & Import to Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
