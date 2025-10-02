import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { laporanAPI, pressdryerAPI } from '../../utils/api';
import { FileText, Download, Calendar, Factory } from 'lucide-react';
import { format } from 'date-fns';

export default function LaporanPressdryer() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mesinId, setMesinId] = useState('');

  const { data: mesinList } = useQuery({
    queryKey: ['mesin-list'],
    queryFn: async () => {
      const response = await pressdryerAPI.getMesin();
      return response.data.data;
    },
  });

  const { data: laporan, isLoading, refetch } = useQuery({
    queryKey: ['laporan-pressdryer', startDate, endDate, mesinId],
    queryFn: async () => {
      const response = await laporanAPI.pressdryer({ 
        start_date: startDate, 
        end_date: endDate,
        mesin_id: mesinId 
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
    setMesinId('');
  };

  const handleExport = async () => {
    try {
      const response = await laporanAPI.exportPressdryer({ 
        start_date: startDate, 
        end_date: endDate 
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan_Pressdryer_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert('Export berhasil!');
    } catch (error) {
      alert('Gagal export: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Laporan Pressdryer</h1>
        <p className="text-gray-600 mt-1">Laporan hasil pressdryer per mesin</p>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center mb-4">
          <Calendar className="text-blue-600 mr-3" size={24} />
          <h2 className="text-lg font-bold">Filter Laporan</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
          <div>
            <label className="label">Mesin</label>
            <select
              value={mesinId}
              onChange={(e) => setMesinId(e.target.value)}
              className="input"
            >
              <option value="">Semua Mesin</option>
              {mesinList?.map((mesin) => (
                <option key={mesin.id} value={mesin.id}>
                  Mesin {mesin.nomor}
                </option>
              ))}
            </select>
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

      {/* Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Factory className="text-green-600 mr-3" size={24} />
            <h2 className="text-lg font-bold">Data Laporan</h2>
          </div>
          <button onClick={handleExport} className="btn btn-success flex items-center text-sm">
            <Download size={18} className="mr-2" />
            Export Excel
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Mesin</th>
                  <th>Pallet Masuk</th>
                  <th>Total Masuk</th>
                  <th>Total OK</th>
                  <th>Total Reject</th>
                  <th>% OK</th>
                </tr>
              </thead>
              <tbody>
                {laporan?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.tanggal ? format(new Date(item.tanggal), 'dd MMM yyyy') : '-'}</td>
                    <td>
                      <span className="badge badge-primary">
                        Mesin {item.mesin_nomor}
                      </span>
                    </td>
                    <td className="font-medium">{item.pallet_masuk || 0}</td>
                    <td className="font-medium">
                      {parseFloat(item.total_masuk || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="text-green-600 font-medium">
                      {parseFloat(item.total_ok || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="text-red-600 font-medium">
                      {parseFloat(item.total_reject || 0).toLocaleString('id-ID')}
                    </td>
                    <td>
                      <span className={`badge ${
                        parseFloat(item.persentase_ok) >= 90 ? 'badge-success' :
                        parseFloat(item.persentase_ok) >= 75 ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {item.persentase_ok || 0}%
                      </span>
                    </td>
                  </tr>
                ))}
                {laporan?.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      Tidak ada data untuk periode ini
                    </td>
                  </tr>
                )}
              </tbody>
              {laporan?.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan="2">TOTAL</td>
                    <td>
                      {laporan.reduce((sum, item) => sum + parseInt(item.pallet_masuk || 0), 0)}
                    </td>
                    <td>
                      {laporan.reduce((sum, item) => sum + parseFloat(item.total_masuk || 0), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="text-green-600">
                      {laporan.reduce((sum, item) => sum + parseFloat(item.total_ok || 0), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="text-red-600">
                      {laporan.reduce((sum, item) => sum + parseFloat(item.total_reject || 0), 0).toLocaleString('id-ID')}
                    </td>
                    <td>
                      {(() => {
                        const totalMasuk = laporan.reduce((sum, item) => sum + parseFloat(item.total_masuk || 0), 0);
                        const totalOk = laporan.reduce((sum, item) => sum + parseFloat(item.total_ok || 0), 0);
                        const avgPersentase = totalMasuk > 0 ? ((totalOk / totalMasuk) * 100).toFixed(2) : 0;
                        return `${avgPersentase}%`;
                      })()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Informasi Laporan</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Laporan ini menampilkan hasil pressdryer per mesin per tanggal</li>
            <li>• Pallet masuk adalah jumlah batch yang diproses</li>
            <li>• Persentase OK dihitung dari: (Total OK / Total Masuk) × 100%</li>
            <li>• Export Excel untuk analisis lebih detail</li>
          </ul>
        </div>

        <div className="card bg-green-50 border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">Standar Kualitas</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• <span className="badge badge-success text-xs">≥ 90%</span> - Excellent (Sangat Baik)</li>
            <li>• <span className="badge badge-warning text-xs">75-89%</span> - Good (Baik)</li>
            <li>• <span className="badge badge-danger text-xs">&lt; 75%</span> - Need Improvement (Perlu Perbaikan)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}