import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { FileText, Database, FormInput, Navigation as NavIcon, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: configData, isLoading: configLoading, isError } = useQuery({
    queryKey: ['mobileConfig'],
    queryFn: async () => {
      const res = await api.get('/mobile/config');
      return res.data.data;
    }
  });

  const { data: pages } = useQuery({
    queryKey: ['adminPages'],
    queryFn: async () => {
      const res = await api.get('/admin/pages/');
      return res.data.data || [];
    }
  });

  const { data: models } = useQuery({
    queryKey: ['adminModels'],
    queryFn: async () => {
      const res = await api.get('/admin/models/');
      return res.data.data || [];
    }
  });

  const { data: forms } = useQuery({
    queryKey: ['adminForms'],
    queryFn: async () => {
      const res = await api.get('/admin/forms/');
      return res.data.data || [];
    }
  });

  const { data: navs } = useQuery({
    queryKey: ['adminNavs'],
    queryFn: async () => {
      const res = await api.get('/admin/navigation/');
      return res.data.data || [];
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">FlowForge Control Center</h2>
        <p className="mt-1 text-gray-500">Configure and deploy backend-driven UI components directly to your mobile application.</p>
      </div>

      {configLoading ? (
        <div className="text-gray-500">Connecting to FlowForge API backend...</div>
      ) : isError ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
          <p className="font-semibold">Backend Connection Issue</p>
          <p className="text-sm mt-1">Cannot reach Python API at http://127.0.0.1:8000. Make sure uvicorn is running.</p>
        </div>
      ) : (
        <>
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <Link to="/pages" className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText size={22} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pages</p>
                  <p className="text-2xl font-bold text-gray-900">{pages?.length || 0}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">{configData?.pages?.length || 0} published to mobile</p>
            </Link>

            <Link to="/models" className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-purple-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                  <Database size={22} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data Models</p>
                  <p className="text-2xl font-bold text-gray-900">{models?.length || 0}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Dynamic schema entities</p>
            </Link>

            <Link to="/forms" className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-emerald-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                  <FormInput size={22} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Forms</p>
                  <p className="text-2xl font-bold text-gray-900">{forms?.length || 0}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Dynamic mobile forms</p>
            </Link>

            <Link to="/navigation" className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-amber-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                  <NavIcon size={22} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Navigation</p>
                  <p className="text-2xl font-bold text-gray-900">{navs?.length || 0}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Tabs & menus</p>
            </Link>
          </div>

          {/* Published Mobile Configuration Inspection */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Active Mobile Bundle (`/api/v1/mobile/config`)</h3>
                <p className="text-xs text-gray-500">Live JSON currently consumed by the React Native client.</p>
              </div>
              <a
                href="http://127.0.0.1:8000/api/v1/mobile/config"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Inspect Raw API <ExternalLink size={14} />
              </a>
            </div>

            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-72">
              {JSON.stringify(configData, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
