import { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Edit, Trash2, Globe, EyeOff, Eye } from 'lucide-react';
import PageEditor from './PageEditor';

interface Page {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string;
  route: string;
  layout_type: string;
  status: string;
  version: number;
  is_published: boolean;
  components: any[];
  created_at: string;
  updated_at: string;
}

export default function Pages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/pages/');
      setPages(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPages(); }, []);

  const deletePage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    await api.delete(`/admin/pages/${id}`);
    fetchPages();
  };

  const publishPage = async (id: string) => {
    await api.post(`/admin/pages/${id}/publish`);
    fetchPages();
  };

  if (creating || editingPage) {
    return (
      <PageEditor
        page={editingPage}
        onClose={() => { setEditingPage(null); setCreating(false); }}
        onSaved={() => { setEditingPage(null); setCreating(false); fetchPages(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pages</h2>
          <p className="mt-1 text-gray-500">Manage server-driven UI pages.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> New Page
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading pages...</div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">No pages created yet.</p>
          <p className="text-gray-400 mt-1">Click "New Page" to create your first server-driven page.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Slug</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Version</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{page.title || page.name}</div>
                    <div className="text-sm text-gray-400">{page.route}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{page.slug}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      page.status === 'published'
                        ? 'bg-green-50 text-green-700'
                        : page.status === 'archived'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {page.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
                      {page.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">v{page.version}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {!page.is_published && (
                        <button onClick={() => publishPage(page.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md" title="Publish">
                          <Globe size={16} />
                        </button>
                      )}
                      <button onClick={() => setEditingPage(page)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => deletePage(page.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md" title="Delete">
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

