import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { laporanAPI } from '../../utils/api';
import { useToast } from '../../components/Toast';
import { Droplet, Calendar, TrendingUp, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LaporanLem() {
  const toast = useToast();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: laporan, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['laporan-lem', startDate, endDate],
    queryFn: async () => {
      try {
        const response = await laporanAPI.penggunaanLem({ 
          start_date: startDate || undefined, 
          end_date: endDate || undefined 
        });
        return response.data.data || [];
      } catch (error) {
        console.error('Laporan lem error:', error);
        throw error;
      }
    },
    retry: 1,
    enabled: true, // Always enabled, even without dates
    onError: (error) => {
      toast.error('Gagal memuat data laporan penggunaan lem');
    },
  });

  const handleFilter = () => {
    refetch();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
  };

  // Prepare chart data - group by tanggal and aggregate by tipe
  const chartData = useMemo(() => {
    if (!laporan || laporan.length === 0) return [];
    
    // Group by tanggal
    const grouped = laporan.reduce((acc, item) => {
      const tanggal = item.tanggal ? format(new Date(item.tanggal), 'dd/MM') : '';
      if (!acc[tanggal]) {
        acc[tanggal] = { tanggal, '3MM': 0, '9MM': 0, '29MM': 0 };
      }
      const tipe = item.tipe_plywood || '';
      if (['3MM', '9MM', '29MM'].includes(tipe)) {
        acc[tanggal][tipe] = parseFloat(item.total_lem || 0);
      }
      return acc;
    }, {});
    
    return Object.values(grouped);
  }, [laporan]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Laporan Penggunaan Lem</h1>
        <p className="page-subtitle">Laporan penggunaan lem harian per tipe plywood</p>
      </div>

      {/* Filter */}
      <div className="card card-elevated">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-xl mr-3">
              <Calendar className="text-blue-600" size={24} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Filter Tanggal</h2>
          </div>
          <button 
            onClick={() => refetch()} 
            className="btn btn-secondary text-sm"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button onClick={handleFilter} className="btn btn-primary">
              Filter
            </button>
            <button onClick={handleReset} className="btn btn-secondary">
              Reset
            </button>
          </div>
        </div>
      </div>

      {isError && (
        <div className="card bg-red-50 border-2 border-red-200">
          <div className="flex items-center">
            <Droplet className="text-red-600 mr-3" size={24} />
            <div>
              <h3 className="font-bold text-red-900 mb-1">Error Memuat Data</h3>
              <p className="text-sm text-red-800">
                {error?.response?.data?.message || error?.message || 'Gagal memuat data laporan'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="card card-elevated">
        <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
          <div className="bg-purple-100 p-3 rounded-xl mr-3">
            <TrendingUp className="text-purple-600" size={24} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Grafik Penggunaan Lem</h2>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Memuat data grafik...</p>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tanggal" />
              <YAxis label={{ value: 'Lem (kg)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="3MM" fill="#3b82f6" name="3MM" />
              <Bar dataKey="9MM" fill="#10b981" name="9MM" />
              <Bar dataKey="29MM" fill="#f59e0b" name="29MM" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-8">Tidak ada data untuk ditampilkan</p>
        )}
      </div>

      {/* Table */}
      <div className="card card-elevated">
        <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
          <div className="bg-blue-100 p-3 rounded-xl mr-3">
            <Droplet className="text-blue-600" size={24} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Data Laporan</h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Memuat data laporan...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Tipe Plywood</th>
                  <th>Total Lem (kg)</th>
                  <th>Total Produksi (lembar)</th>
                  <th>Jumlah Setting</th>
                  <th>Lem per Unit (kg)</th>
                </tr>
              </thead>
              <tbody>
                {laporan && laporan.length > 0 ? (
                  laporan.map((item, index) => (
                    <tr key={index}>
                      <td>{item.tanggal ? format(new Date(item.tanggal), 'dd MMM yyyy') : '-'}</td>
                      <td>
                        <span className={`badge ${
                          item.tipe_plywood === '3MM' ? 'badge-primary' :
                          item.tipe_plywood === '9MM' ? 'badge-success' :
                          'bg-orange-100 text-orange-800 border border-orange-200'
                        }`}>
                          {item.tipe_plywood || '-'}
                        </span>
                      </td>
                      <td className="font-medium text-blue-600">
                        {parseFloat(item.total_lem || 0).toLocaleString('id-ID', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        })} kg
                      </td>
                      <td className="font-medium">
                        {parseFloat(item.total_produksi || 0).toLocaleString('id-ID')}
                      </td>
                      <td>
                        <span className="badge badge-gray">{item.jumlah_setting || 0}x</span>
                      </td>
                      <td className="text-gray-600 font-medium">
                        {parseFloat(item.lem_per_unit || 0).toLocaleString('id-ID', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        })} kg
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <Droplet className="mx-auto text-gray-300 mb-3" size={48} />
                      <p className="text-gray-500 font-medium">Tidak ada data untuk periode ini</p>
                      <p className="text-sm text-gray-400 mt-1">Coba ubah filter tanggal atau pastikan sudah ada data setting plywood</p>
                    </td>
                  </tr>
                )}
              </tbody>
              {laporan?.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan="2">TOTAL</td>
                    <td className="text-blue-600">
                      {laporan.reduce((sum, item) => sum + parseFloat(item.total_lem || 0), 0).toLocaleString('id-ID', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} kg
                    </td>
                    <td>
                      {laporan.reduce((sum, item) => sum + parseFloat(item.total_produksi || 0), 0).toLocaleString('id-ID')}
                    </td>
                    <td>
                      {laporan.reduce((sum, item) => sum + parseInt(item.jumlah_setting || 0), 0)}x
                    </td>
                    <td>
                      {(() => {
                        const totalLem = laporan.reduce((sum, item) => sum + parseFloat(item.total_lem || 0), 0);
                        const totalProduksi = laporan.reduce((sum, item) => sum + parseFloat(item.total_produksi || 0), 0);
                        const avg = totalProduksi > 0 ? (totalLem / totalProduksi) : 0;
                        return avg.toLocaleString('id-ID', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }) + ' kg';
                      })()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <h3 className="font-bold text-blue-900 mb-3">3MM Plywood</h3>
          <p className="text-sm text-blue-800 leading-relaxed">
            Formula standar menggunakan lem untuk merekatkan 1 shortcore + face + back
          </p>
        </div>

        <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
          <h3 className="font-bold text-green-900 mb-3">9MM Plywood</h3>
          <p className="text-sm text-green-800 leading-relaxed">
            Formula menggunakan lem lebih banyak karena terdiri dari 2 shortcore + 1 longcore
          </p>
        </div>

        <div className="card bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200">
          <h3 className="font-bold text-orange-900 mb-3">29MM Plywood</h3>
          <p className="text-sm text-orange-800 leading-relaxed">
            Formula sama dengan 9MM, menggunakan 2 shortcore + 1 longcore dengan ketebalan berbeda
          </p>
        </div>
      </div>

      <div className="card bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
        <h3 className="font-bold text-purple-900 mb-3 flex items-center">
          <Droplet className="mr-2" size={20} />
          Informasi Penggunaan Lem
        </h3>
        <ul className="text-sm text-purple-800 space-y-2">
          <li className="flex items-start">
            <span className="font-bold mr-2">•</span>
            <span>Lem digunakan untuk merekatkan lapisan-lapisan kayu menjadi plywood</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">•</span>
            <span>Jumlah lem per unit bervariasi tergantung tipe plywood</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">•</span>
            <span>Monitor penggunaan lem untuk efisiensi produksi dan cost control</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">•</span>
            <span>Data diambil dari proses Setting Plywood</span>
          </li>
        </ul>
      </div>
    </div>
  );
}