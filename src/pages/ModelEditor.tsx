import { useState } from 'react';
import { api } from '../api';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface ModelEditorProps {
  model: any | null;
  onClose: () => void;
  onSaved: () => void;
}

const FIELD_TYPES = [
  'text', 'textarea', 'number', 'boolean', 'email', 'phone',
  'date', 'datetime', 'time', 'select', 'multiselect', 'image', 'file', 'url'
];

export default function ModelEditor({ model, onClose, onSaved }: ModelEditorProps) {
  const [modelData, setModelData] = useState({
    name: model?.name || '',
    slug: model?.slug || '',
    label: model?.label || '',
    description: model?.description || '',
    fields: model?.fields || [],
  });
  const [saving, setSaving] = useState(false);

  const updateField = (key: string, value: any) => {
    setModelData(prev => ({ ...prev, [key]: value }));
  };

  const addField = () => {
    const newField = {
      name: `field_${modelData.fields.length + 1}`,
      label: `Field ${modelData.fields.length + 1}`,
      type: 'text',
      required: false,
      unique: false,
      options: '',
    };
    updateField('fields', [...modelData.fields, newField]);
  };

  const removeField = (index: number) => {
    updateField('fields', modelData.fields.filter((_: any, i: number) => i !== index));
  };

  const updateFieldProp = (index: number, key: string, value: any) => {
    const updated = [...modelData.fields];
    updated[index] = { ...updated[index], [key]: value };
    updateField('fields', updated);
  };

  const save = async () => {
    if (!modelData.name || !modelData.slug) {
      alert('Please provide at least a Model Name and a unique Slug.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: modelData.name,
        slug: modelData.slug,
        label: modelData.label || modelData.name,
        description: modelData.description,
        fields: modelData.fields.map((f: any) => ({
          ...f,
          options: typeof f.options === 'string' && f.options.trim()
            ? f.options.split(',').map((o: string) => o.trim())
            : f.options
        })),
      };

      if (model) {
        await api.put(`/admin/models/${model.id}`, payload);
      } else {
        await api.post('/admin/models/', payload);
      }
      onSaved();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to save model definition');
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
            {model ? 'Edit Model Definition' : 'New Model Definition'}
          </h2>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Model'}
        </button>
      </div>

      {/* Basic Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Entity Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model Name (code)</label>
            <input
              value={modelData.name}
              onChange={e => updateField('name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. event"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (unique)</label>
            <input
              value={modelData.slug}
              onChange={e => updateField('slug', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. events"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Human Label</label>
            <input
              value={modelData.label}
              onChange={e => updateField('label', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Event"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              value={modelData.description}
              onChange={e => updateField('description', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Entity purpose or notes"
            />
          </div>
        </div>
      </div>

      {/* Model Fields Builder */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Schema Fields</h3>
            <p className="text-sm text-gray-500">Define columns/properties for this model.</p>
          </div>
          <button
            onClick={addField}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 text-sm transition-colors"
          >
            <Plus size={16} /> Add Field
          </button>
        </div>

        {modelData.fields.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No fields defined yet. Click "Add Field" to define schema attributes.
          </div>
        ) : (
          <div className="space-y-4">
            {modelData.fields.map((field: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Field #{index + 1}
                  </span>
                  <button onClick={() => removeField(index)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1">
                    <Trash2 size={14} /> Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Field Name (key)</label>
                    <input
                      value={field.name}
                      onChange={e => updateFieldProp(index, 'name', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                      placeholder="e.g. title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                    <input
                      value={field.label}
                      onChange={e => updateFieldProp(index, 'label', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                      placeholder="e.g. Title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Field Type</label>
                    <select
                      value={field.type}
                      onChange={e => updateFieldProp(index, 'type', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white"
                    >
                      {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-4 pt-6">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id={`mreq_${index}`}
                        checked={field.required || false}
                        onChange={e => updateFieldProp(index, 'required', e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`mreq_${index}`} className="text-sm font-medium text-gray-700">
                        Required
                      </label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id={`munq_${index}`}
                        checked={field.unique || false}
                        onChange={e => updateFieldProp(index, 'unique', e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`munq_${index}`} className="text-sm font-medium text-gray-700">
                        Unique
                      </label>
                    </div>
                  </div>
                </div>

                {(field.type === 'select' || field.type === 'multiselect') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Allowed Options (comma separated)</label>
                    <input
                      value={Array.isArray(field.options) ? field.options.join(', ') : (field.options || '')}
                      onChange={e => updateFieldProp(index, 'options', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

