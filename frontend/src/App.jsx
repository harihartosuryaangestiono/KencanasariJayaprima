import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './utils/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';

// Import all pages
import {
  Login,
  Dashboard,
  Suppliers,
  InputBahan,
  QCChecklist,
  Pressdryer,
  Repair,
  CoreBuilder,
  ScraffJoin,
  SettingPlywood,
  Hotpress,
  LaporanFaceback,
  LaporanPressdryer,
  LaporanLem,
  LaporanStokGudang
} from './pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Wait for auth check to complete before redirecting
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto mb-4 border-t-primary-600"></div>
          <p className="text-slate-600 font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              
              {/* PPIC Routes */}
              <Route path="suppliers" element={
                <ProtectedRoute allowedRoles={['PPIC']}>
                  <Suppliers />
                </ProtectedRoute>
              } />
              <Route path="input-bahan" element={
                <ProtectedRoute allowedRoles={['PPIC']}>
                  <InputBahan />
                </ProtectedRoute>
              } />
              
              {/* Produksi Routes */}
              <Route path="qc-checklist" element={
                <ProtectedRoute allowedRoles={['PRODUKSI']}>
                  <QCChecklist />
                </ProtectedRoute>
              } />
              <Route path="pressdryer" element={
                <ProtectedRoute allowedRoles={['PRODUKSI']}>
                  <Pressdryer />
                </ProtectedRoute>
              } />
              <Route path="repair" element={
                <ProtectedRoute allowedRoles={['PRODUKSI']}>
                  <Repair />
                </ProtectedRoute>
              } />
              <Route path="core-builder" element={
                <ProtectedRoute allowedRoles={['PRODUKSI']}>
                  <CoreBuilder />
                </ProtectedRoute>
              } />
              <Route path="scraff-join" element={
                <ProtectedRoute allowedRoles={['PRODUKSI']}>
                  <ScraffJoin />
                </ProtectedRoute>
              } />
              <Route path="setting-plywood" element={
                <ProtectedRoute allowedRoles={['PRODUKSI']}>
                  <SettingPlywood />
                </ProtectedRoute>
              } />
              <Route path="hotpress" element={
                <ProtectedRoute allowedRoles={['PRODUKSI']}>
                  <Hotpress />
                </ProtectedRoute>
              } />
              
              {/* Laporan Routes (All roles can view) */}
              <Route path="laporan/faceback" element={<LaporanFaceback />} />
              <Route path="laporan/pressdryer" element={<LaporanPressdryer />} />
              <Route path="laporan/lem" element={<LaporanLem />} />
              <Route path="laporan/stok-gudang" element={<LaporanStokGudang />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;



