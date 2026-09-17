import { useState } from 'react';
import { api } from '../api';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface FormEditorProps {
  form: any | null;
  onClose: () => void;
  onSaved: () => void;
}

const FIELD_TYPES = [
  'text', 'textarea', 'number', 'boolean', 'email', 'phone',
  'date', 'datetime', 'time', 'select', 'multiselect', 'image', 'file', 'url'
];

export default function FormEditor({ form, onClose, onSaved }: FormEditorProps) {
  const [formData, setFormData] = useState({
    name: form?.name || '',
    slug: form?.slug || '',
    title: form?.title || '',
    description: form?.description || '',
    success_message: form?.success_message || 'Form submitted successfully!',
    failure_message: form?.failure_message || 'Submission failed. Please check your inputs.',
    submit_method: form?.submit_action?.method || 'POST',
    submit_endpoint: form?.submit_action?.endpoint || '/api/v1/data',
    fields: form?.fields || [],
  });
  const [saving, setSaving] = useState(false);

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const addField = () => {
    const newField = {
      name: `field_${formData.fields.length + 1}`,
      label: `Field ${formData.fields.length + 1}`,
      type: 'text',
      required: false,
      placeholder: '',
      options: '',
    };
    updateField('fields', [...formData.fields, newField]);
  };

  const removeField = (index: number) => {
    updateField('fields', formData.fields.filter((_: any, i: number) => i !== index));
  };

  const updateFieldProp = (index: number, key: string, value: any) => {
    const updated = [...formData.fields];
    updated[index] = { ...updated[index], [key]: value };
    updateField('fields', updated);
  };

  const save = async () => {
    if (!formData.name || !formData.slug) {
      alert('Please provide at least a Form Name and a unique Slug.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug,
        title: formData.title,
        description: formData.description,
        success_message: formData.success_message,
        failure_message: formData.failure_message,
        submit_action: {
          method: formData.submit_method,
          endpoint: formData.submit_endpoint,
        },
        fields: formData.fields.map((f: any) => ({
          ...f,
          options: typeof f.options === 'string' && f.options.trim()
            ? f.options.split(',').map((o: string) => o.trim())
            : f.options
        })),
      };

      if (form) {
        await api.put(`/admin/forms/${form.id}`, payload);
      } else {
        await api.post('/admin/forms/', payload);
      }
      onSaved();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to save form');
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
            {form ? 'Edit Form' : 'New Form Definition'}
          </h2>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Form'}
        </button>
      </div>

      {/* Basic Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Form Configuration</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={formData.name}
              onChange={e => updateField('name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Member Registration"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (unique)</label>
            <input
              value={formData.slug}
              onChange={e => updateField('slug', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. member_registration"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              value={formData.title}
              onChange={e => updateField('title', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Sign Up Now"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              value={formData.description}
              onChange={e => updateField('description', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Form description or subtitle"
            />
          </div>
        </div>

        {/* Submit & Messages */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Submit Method</label>
            <select
              value={formData.submit_method}
              onChange={e => updateField('submit_method', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Submit Endpoint</label>
            <input
              value={formData.submit_endpoint}
              onChange={e => updateField('submit_endpoint', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. /api/v1/members"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Success Message</label>
            <input
              value={formData.success_message}
              onChange={e => updateField('success_message', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Failure Message</label>
            <input
              value={formData.failure_message}
              onChange={e => updateField('failure_message', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Form Fields Builder */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Form Fields</h3>
            <p className="text-sm text-gray-500">Add dynamic input fields rendered in the mobile app.</p>
          </div>
          <button
            onClick={addField}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 text-sm transition-colors"
          >
            <Plus size={16} /> Add Field
          </button>
        </div>

        {formData.fields.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No fields added yet. Click "Add Field" to define inputs.
          </div>
        ) : (
          <div className="space-y-4">
            {formData.fields.map((field: any, index: number) => (
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
                    <label className="block text-xs font-medium text-gray-600 mb-1">Field Key (Name)</label>
                    <input
                      value={field.name}
                      onChange={e => updateFieldProp(index, 'name', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                      placeholder="e.g. first_name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                    <input
                      value={field.label}
                      onChange={e => updateFieldProp(index, 'label', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                      placeholder="e.g. First Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                    <select
                      value={field.type}
                      onChange={e => updateFieldProp(index, 'type', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white"
                    >
                      {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id={`req_${index}`}
                      checked={field.required || false}
                      onChange={e => updateFieldProp(index, 'required', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`req_${index}`} className="text-sm font-medium text-gray-700">
                      Required
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Placeholder</label>
                    <input
                      value={field.placeholder || ''}
                      onChange={e => updateFieldProp(index, 'placeholder', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                      placeholder="e.g. Enter your name..."
                    />
                  </div>
                  {(field.type === 'select' || field.type === 'multiselect') && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Options (comma separated)</label>
                      <input
                        value={Array.isArray(field.options) ? field.options.join(', ') : (field.options || '')}
                        onChange={e => updateFieldProp(index, 'options', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                        placeholder="Option 1, Option 2, Option 3"
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

