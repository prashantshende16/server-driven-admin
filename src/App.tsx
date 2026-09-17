import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Database, Settings as SettingsIcon, FormInput, Navigation as NavIcon, LogOut } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Pages from './pages/Pages';
import Forms from './pages/Forms';
import Models from './pages/Models';
import Navigations from './pages/Navigations';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { setAuthToken } from './api';

function NavLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon size={20} /> {label}
    </Link>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    setAuthToken(null);
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">FlowForge Admin</h1>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          <NavLink to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavLink to="/pages" icon={FileText} label="Pages" />
          <NavLink to="/models" icon={Database} label="Models" />
          <NavLink to="/forms" icon={FormInput} label="Forms" />
          <NavLink to="/navigation" icon={NavIcon} label="Navigation" />
          <NavLink to="/settings" icon={SettingsIcon} label="Settings" />
        </nav>
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">FlowForge Engine</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors"
            title="Sign out"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pages" element={<Pages />} />
                <Route path="/models" element={<Models />} />
                <Route path="/forms" element={<Forms />} />
                <Route path="/navigation" element={<Navigations />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
