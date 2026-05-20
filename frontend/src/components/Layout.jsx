import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { 
  LayoutDashboard, Package, ClipboardCheck, Factory, 
  FileText, LogOut, Menu, X, Users, PackagePlus 
} from 'lucide-react';
import { useState } from 'react';
import Clock from './Clock';
import Logo from './Logo';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = {
    PPIC: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/suppliers', icon: Users, label: 'Suppliers' },
      { path: '/input-bahan', icon: PackagePlus, label: 'Input Bahan Masuk' },
      { path: '/laporan/stok-gudang', icon: FileText, label: 'Stok Gudang' },
    ],
    PRODUKSI: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/qc-checklist', icon: ClipboardCheck, label: 'QC Checklist' },
      { path: '/pressdryer', icon: Factory, label: 'Pressdryer' },
      { path: '/repair', icon: Package, label: 'Repair' },
      { path: '/core-builder', icon: Package, label: 'Core Builder' },
      { path: '/scraff-join', icon: Package, label: 'Scraff Join' },
      { path: '/setting-plywood', icon: Package, label: 'Setting Plywood' },
      { path: '/hotpress', icon: Factory, label: 'Hotpress' },
    ],
    BOS: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/laporan/faceback', icon: FileText, label: 'Lap. Face & Back' },
      { path: '/laporan/pressdryer', icon: FileText, label: 'Lap. Pressdryer' },
      { path: '/laporan/lem', icon: FileText, label: 'Lap. Penggunaan Lem' },
      { path: '/laporan/stok-gudang', icon: FileText, label: 'Lap. Stok Gudang' },
    ],
  };

  const currentMenu = menuItems[user?.role] || [];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated light passing over header */}
      <div className="fixed top-0 left-0 right-0 h-24 z-50 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent animate-light-reflect" style={{ width: '200%', transform: 'translateX(-50%)' }}></div>
      </div>

      {/* Top Navbar */}
      <nav className="bg-white fixed top-0 left-0 right-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all lg:hidden"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                  <Logo size={36} />
                </div>
                <div>
                  <h1 className="text-lg lg:text-xl font-bold text-slate-900">
                    PT. Kencana Sari Jaya
                  </h1>
                  <p className="text-xs text-slate-600 hidden sm:block">
                    Plywood Production Monitoring System
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block flex-shrink-0">
                <Clock />
              </div>
              <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                <p className="text-sm font-semibold text-slate-900">{user?.username}</p>
                <p className="text-xs text-slate-600">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`bg-white fixed left-0 top-16 bottom-0 w-64 border-r border-slate-200 transition-transform duration-300 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{
          background: 
            'linear-gradient(180deg, rgba(250, 248, 245, 0.98) 0%, rgba(245, 240, 232, 0.98) 50%, rgba(250, 248, 245, 0.98) 100%), url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e0a870\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M50 50v-5h-3v5h-5v3h5v5h3v-5h5v-3h-5zm0-30V10h-3v5h-5v3h5v5h3V15h5v-3h-5zM10 50v-5H7v5H2v3h5v5h3v-5h5v-3h-5zM10 10V7H7v5H2v3h5v5h3V15h5v-3H10z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          backgroundSize: '100% 100%, 80px 80px'
        }}
      >
        <nav className="h-full overflow-y-auto p-4">
          <ul className="space-y-1">
            {currentMenu.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon 
                      size={20} 
                      className={`mr-3 ${
                        isActive ? 'text-primary-600' : 'text-slate-500'
                      }`} 
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-primary-700' : 'text-slate-600'
                    }`}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-72' : ''
        }`}
      >
        <div className="p-6 lg:p-8 max-w-[1920px] mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Overlay untuk mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-charcoal-900/40 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}