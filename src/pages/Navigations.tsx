import { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Edit, Trash2, CheckCircle2, Navigation as NavIcon } from 'lucide-react';
import NavigationEditor from './NavigationEditor';

interface NavItem {
  id: string;
  name: string;
  slug: string;
  nav_type: string;
  items: any[];
  is_active: boolean;
  version: number;
  created_at: string;
}

export default function Navigations() {
  const [navigations, setNavigations] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNav, setEditingNav] = useState<NavItem | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchNavigations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/navigation/');
      setNavigations(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNavigations(); }, []);

  const deleteNav = async (id: string) => {
    if (!confirm('Are you sure you want to delete this navigation configuration?')) return;
    await api.delete(`/admin/navigation/${id}`);
    fetchNavigations();
  };

  const activateNav = async (id: string) => {
    await api.post(`/admin/navigation/${id}/activate`);
    fetchNavigations();
  };

  if (creating || editingNav) {
    return (
      <NavigationEditor
        nav={editingNav}
        onClose={() => { setEditingNav(null); setCreating(false); }}
        onSaved={() => { setEditingNav(null); setCreating(false); fetchNavigations(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Navigation Configurations</h2>
          <p className="mt-1 text-gray-500">Configure menus, bottom tabs, drawers, and nested route hierarchies.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> New Navigation
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading navigations...</div>
      ) : navigations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <NavIcon size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 text-lg">No navigation configurations found.</p>
          <p className="text-gray-400 mt-1">Click "New Navigation" to configure your mobile tabs or drawer menu.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Navigation Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Type</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Slug</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Items</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {navigations.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                      {item.nav_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{item.slug}</code>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.items?.length || 0} menu items
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.is_active
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.is_active && <CheckCircle2 size={12} />}
                      {item.is_active ? 'Active on Mobile' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {!item.is_active && (
                        <button
                          onClick={() => activateNav(item.id)}
                          className="text-xs bg-gray-100 hover:bg-green-50 hover:text-green-700 px-2.5 py-1 rounded text-gray-700 transition-colors"
                        >
                          Set Active
                        </button>
                      )}
                      <button onClick={() => setEditingNav(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => deleteNav(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md" title="Delete">
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

