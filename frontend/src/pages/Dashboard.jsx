import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../utils/api';
import { useToast } from '../components/Toast';
import { Package, AlertCircle, CheckCircle, Factory, Droplet, RefreshCw, Activity, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import AnimatedNumber from '../components/AnimatedNumber';

export default function Dashboard() {
  const toast = useToast();
  const { data: summary, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      try {
        const response = await dashboardAPI.getSummary();
        // Handle both success: true and success: false responses
        if (response.data.success === false) {
          console.warn('Dashboard returned error but with data:', response.data);
          return response.data.data || {};
        }
        return response.data.data || {};
      } catch (error) {
        console.error('Dashboard error:', error);
        // Return empty structure on error so UI doesn't break
        return {
          stok_gudang: [],
          menunggu_qc: 0,
          produksi_hari_ini: { total: 0, jumlah: 0 },
          pressdryer_aktif: { mesin: 0, total_proses: 0, total_ok: 0, total_reject: 0 },
          lem_hari_ini: 0,
          produksi_7_hari: [],
          top_suppliers: []
        };
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1,
    onError: (error) => {
      console.error('Dashboard query error:', error);
      const errorMessage = error?.isNetworkError 
        ? error.message || 'Tidak dapat terhubung ke server. Pastikan backend server sedang berjalan.'
        : 'Gagal memuat data dashboard. Silakan refresh halaman.';
      toast.error(errorMessage);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center animate-fade-in">
          <div className="spinner h-12 w-12 mx-auto mb-4 border-t-primary-600"></div>
          <p className="text-slate-600 font-medium">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center animate-fade-in">
          <div className="card">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <p className="text-slate-900 font-medium mb-6 text-lg">Gagal memuat data dashboard</p>
            <button onClick={() => refetch()} className="btn btn-primary">
              <RefreshCw size={18} className="mr-2" />
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Menunggu QC',
      value: summary?.menunggu_qc || 0,
      icon: AlertCircle,
    },
    {
      title: 'Produksi Hari Ini',
      value: summary?.produksi_hari_ini?.total || 0,
      subtitle: `${summary?.produksi_hari_ini?.jumlah || 0} lembar`,
      icon: CheckCircle,
    },
    {
      title: 'Pressdryer Aktif',
      value: summary?.pressdryer_aktif?.mesin || 0,
      subtitle: `${summary?.pressdryer_aktif?.total_ok || 0} OK / ${summary?.pressdryer_aktif?.total_reject || 0} Reject`,
      icon: Factory,
    },
    {
      title: 'Lem Terpakai (Hari Ini)',
      value: summary?.lem_hari_ini || 0,
      suffix: ' kg',
      icon: Droplet,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <Activity className="text-primary-600" size={28} strokeWidth={2} />
          Production Dashboard
        </h1>
        <p className="page-subtitle">
          Real-time Monitoring System
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className="card group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mb-1">
                    {typeof stat.value === 'string' ? (
                      stat.value
                    ) : (
                      <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                    )}
                  </p>
                  {stat.subtitle && (
                    <p className="text-sm text-slate-600">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                <div className="bg-primary-100 p-4 rounded-lg">
                  <Icon className="text-primary-600" size={28} strokeWidth={2} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stok Gudang */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-3 rounded-lg">
              <Package className="text-primary-600" size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Raw Material Stock</h2>
          </div>
          <button 
            onClick={() => refetch()} 
            className="btn btn-primary text-sm"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          {summary?.stok_gudang && summary.stok_gudang.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Warehouse</th>
                  <th>Total Batch</th>
                  <th>Total Quantity</th>
                </tr>
              </thead>
              <tbody>
                {summary.stok_gudang.map((stok, index) => (
                  <tr key={index} style={{ animationDelay: `${0.5 + index * 0.1}s` }} className="animate-slide-right">
                    <td className="font-semibold text-slate-900">{stok.gudang || '-'}</td>
                    <td>
                      <span className="badge badge-primary">
                        <AnimatedNumber value={stok.total_batch || 0} /> batch
                      </span>
                    </td>
                    <td className="font-bold text-lg text-slate-900">
                      <AnimatedNumber value={parseFloat(stok.total_jumlah || 0)} /> sheets
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-slate-600 font-medium">No warehouse stock data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produksi 7 Hari */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-3 rounded-lg">
              <TrendingUp className="text-primary-600" size={20} />
            </div>
              <h2 className="text-lg font-bold text-slate-900">7-Day Production Trend</h2>
            </div>
          </div>
          {summary?.produksi_7_hari && summary.produksi_7_hari.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={summary.produksi_7_hari}>
                <defs>
                  <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(226, 232, 240, 1)" />
                <XAxis 
                  dataKey="tanggal" 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    border: '1px solid rgba(226, 232, 240, 1)',
                    borderRadius: '8px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  fill="url(#colorProduction)"
                  name="Production"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <BarChart className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-slate-600 font-medium">No production data available</p>
            </div>
          )}
        </div>

        {/* Top Suppliers */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 p-3 rounded-lg">
                <Package className="text-primary-600" size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Top 5 Suppliers</h2>
            </div>
            <span className="text-xs text-slate-600 font-medium">Last 30 Days</span>
          </div>
          {summary?.top_suppliers && summary.top_suppliers.length > 0 ? (
            <div className="space-y-3">
              {summary.top_suppliers.map((supplier, index) => (
                <div 
                  key={index} 
                  className="bg-white flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary-600 w-10 h-10 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-base">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 mb-1">{supplier.nama || '-'}</p>
                      <p className="text-sm text-slate-600">
                        <AnimatedNumber value={supplier.total_transaksi || 0} /> transactions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900 mb-1">
                      <AnimatedNumber value={parseFloat(supplier.total_jumlah || 0)} />
                    </p>
                    <p className="text-xs text-slate-500">sheets</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-slate-600 font-medium">No supplier data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}