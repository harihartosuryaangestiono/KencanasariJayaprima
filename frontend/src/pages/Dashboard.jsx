import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../utils/api';
import { Package, AlertCircle, CheckCircle, Factory, Droplet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Dashboard() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const response = await dashboardAPI.getSummary();
      return response.data.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Menunggu QC',
      value: summary?.menunggu_qc || 0,
      icon: AlertCircle,
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Produksi Hari Ini',
      value: summary?.produksi_hari_ini?.total || 0,
      subtitle: `${summary?.produksi_hari_ini?.jumlah || 0} lembar`,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      title: 'Pressdryer Aktif',
      value: summary?.pressdryer_aktif?.mesin || 0,
      subtitle: `${summary?.pressdryer_aktif?.total_ok || 0} OK / ${summary?.pressdryer_aktif?.total_reject || 0} Reject`,
      icon: Factory,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      title: 'Lem Terpakai (Hari Ini)',
      value: `${summary?.lem_hari_ini || 0} kg`,
      icon: Droplet,
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Monitoring Produksi Plywood Real-time</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={stat.textColor} size={28} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stok Gudang */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Stok per Gudang</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Gudang</th>
                <th>Total Batch</th>
                <th>Total Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {summary?.stok_gudang?.map((stok, index) => (
                <tr key={index}>
                  <td className="font-medium">{stok.gudang}</td>
                  <td>{stok.total_batch}</td>
                  <td>{parseFloat(stok.total_jumlah).toLocaleString('id-ID')} lembar</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produksi 7 Hari */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Produksi 7 Hari Terakhir</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={summary?.produksi_7_hari || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tanggal" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#3b82f6" name="Jumlah" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Suppliers */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top 5 Suppliers (30 Hari)</h2>
          <div className="space-y-3">
            {summary?.top_suppliers?.map((supplier, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{supplier.nama}</p>
                  <p className="text-sm text-gray-600">{supplier.total_transaksi} transaksi</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    {parseFloat(supplier.total_jumlah).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-500">lembar</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}