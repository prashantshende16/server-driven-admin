import { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Edit, Trash2, Globe, EyeOff, Eye, FormInput } from 'lucide-react';
import FormEditor from './FormEditor';

interface FormItem {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string;
  fields: any[];
  validation_rules: any;
  submit_action: any;
  success_message: string;
  failure_message: string;
  is_published: boolean;
  version: number;
  created_at: string;
}

export default function Forms() {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingForm, setEditingForm] = useState<FormItem | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/forms/');
      setForms(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchForms(); }, []);

  const deleteForm = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;
    await api.delete(`/admin/forms/${id}`);
    fetchForms();
  };

  const publishForm = async (id: string) => {
    await api.post(`/admin/forms/${id}/publish`);
    fetchForms();
  };

  if (creating || editingForm) {
    return (
      <FormEditor
        form={editingForm}
        onClose={() => { setEditingForm(null); setCreating(false); }}
        onSaved={() => { setEditingForm(null); setCreating(false); fetchForms(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Form Builder</h2>
          <p className="mt-1 text-gray-500">Design dynamic, server-driven forms for your mobile application.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> New Form
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading forms...</div>
      ) : forms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FormInput size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 text-lg">No forms created yet.</p>
          <p className="text-gray-400 mt-1">Click "New Form" to define your first dynamic form.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Form Title / Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Slug</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Fields</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Version</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {forms.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{item.title || item.name}</div>
                    <div className="text-xs text-gray-400">{item.description || item.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{item.slug}</code>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                      {item.fields?.length || 0} fields
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      item.is_published
                        ? 'bg-green-50 text-green-700'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {item.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
                      {item.is_published ? 'published' : 'draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">v{item.version}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {!item.is_published && (
                        <button onClick={() => publishForm(item.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md" title="Publish">
                          <Globe size={16} />
                        </button>
                      )}
                      <button onClick={() => setEditingForm(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => deleteForm(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

