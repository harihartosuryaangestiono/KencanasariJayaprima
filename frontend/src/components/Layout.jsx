import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { 
  LayoutDashboard, Package, ClipboardCheck, Factory, 
  FileText, LogOut, Menu, X, Users, PackagePlus 
} from 'lucide-react';
import { useState } from 'react';

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
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100 lg:hidden"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="ml-2 text-xl font-bold text-gray-900">
                PT. Kencana Sari Jaya Monitoring
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 transition-transform duration-300 z-30 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
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
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} className="mr-3" />
                    <span className="text-sm">{item.label}</span>
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
          sidebarOpen ? 'lg:ml-64' : ''
        }`}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      {/* Overlay untuk mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}