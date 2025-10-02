import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { laporanAPI } from '../../utils/api';
import { Droplet, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LaporanLem() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: laporan, isLoading, refetch } = useQuery({
    queryKey: ['laporan-lem', startDate, endDate],
    queryFn: async () => {
      const response = await laporanAPI.penggunaanLem({ 
        start_date: startDate, 
        end_date: endDate 
      });
      return response.data.data;
    },
  });

  const handleFilter = () => {
    refetch();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
  };

  // Prepare chart data
  const chartData = laporan?.map(item => ({
    tanggal: item.tanggal ? format(new Date(item.tanggal), 'dd/MM') : '',
    '3MM': item.tipe_plywood === '3MM' ? parseFloat(item.total_lem) : 0,
    '9MM': item.tipe_plywood === '9MM' ? parseFloat(item.total_lem) : 0,
    '29MM': item.tipe_plywood === '29MM' ? parseFloat(item.total_lem) : 0,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Laporan Penggunaan Lem</h1>
        <p className="text-gray-600 mt-1">Laporan penggunaan lem harian per tipe plywood</p>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center mb-4">
          <Calendar className="text-blue-600 mr-3" size={24} />
          <h2 className="text-lg font-bold">Filter Tanggal</h2>
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

      {/* Chart */}
      <div className="card">
        <div className="flex items-center mb-4">
          <TrendingUp className="text-purple-600 mr-3" size={24} />
          <h2 className="text-lg font-bold">Grafik Penggunaan Lem</h2>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
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
      <div className="card">
        <div className="flex items-center mb-4">
          <Droplet className="text-blue-600 mr-3" size={24} />
          <h2 className="text-lg font-bold">Data Laporan</h2>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
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
                {laporan?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.tanggal ? format(new Date(item.tanggal), 'dd MMM yyyy') : '-'}</td>
                    <td>
                      <span className={`badge ${
                        item.tipe_plywood === '3MM' ? 'badge-primary' :
                        item.tipe_plywood === '9MM' ? 'badge-success' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {item.tipe_plywood}
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
                    <td>{item.jumlah_setting || 0}x</td>
                    <td className="text-gray-600">
                      {parseFloat(item.lem_per_unit || 0).toLocaleString('id-ID', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })} kg
                    </td>
                  </tr>
                ))}
                {laporan?.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      Tidak ada data untuk periode ini
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
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">3MM Plywood</h3>
          <p className="text-sm text-blue-800">
            Formula standar menggunakan lem untuk merekatkan 1 shortcore + face + back
          </p>
        </div>

        <div className="card bg-green-50 border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">9MM Plywood</h3>
          <p className="text-sm text-green-800">
            Formula menggunakan lem lebih banyak karena terdiri dari 2 shortcore + 1 longcore
          </p>
        </div>

        <div className="card bg-orange-50 border-orange-200">
          <h3 className="font-semibold text-orange-900 mb-2">29MM Plywood</h3>
          <p className="text-sm text-orange-800">
            Formula sama dengan 9MM, menggunakan 2 shortcore + 1 longcore dengan ketebalan berbeda
          </p>
        </div>
      </div>

      <div className="card bg-purple-50 border-purple-200">
        <h3 className="font-semibold text-purple-900 mb-2">Informasi Penggunaan Lem</h3>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Lem digunakan untuk merekatkan lapisan-lapisan kayu menjadi plywood</li>
          <li>• Jumlah lem per unit bervariasi tergantung tipe plywood</li>
          <li>• Monitor penggunaan lem untuk efisiensi produksi dan cost control</li>
          <li>• Data diambil dari proses Setting Plywood</li>
        </ul>
      </div>
    </div>
  );
}