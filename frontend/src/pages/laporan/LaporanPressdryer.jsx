import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { laporanAPI, pressdryerAPI } from '../../utils/api';
import { useToast } from '../../components/Toast';
import { FileText, Download, Calendar, Factory } from 'lucide-react';
import { format } from 'date-fns';

export default function LaporanPressdryer() {
  const toast = useToast();
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

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      const response = await laporanAPI.exportPressdryer({ 
        start_date: startDate || undefined, 
        end_date: endDate || undefined,
        mesin_id: mesinId || undefined
      });
      
      // Handle blob response
      const blob = response.data instanceof Blob 
        ? response.data 
        : new Blob([response.data], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `Laporan_Pressdryer_${startDate || 'all'}_${endDate || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('Export berhasil! File sedang didownload...');
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error.response?.data?.error 
        || error.message 
        || 'Gagal melakukan export. Pastikan server berjalan dan coba lagi.';
      toast.error('Gagal export: ' + errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Laporan Pressdryer</h1>
        <p className="page-subtitle">Laporan hasil pressdryer per mesin</p>
      </div>

      {/* Filter */}
      <div className="card card-elevated">
        <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
          <div className="bg-blue-100 p-3 rounded-xl mr-3">
            <Calendar className="text-blue-600" size={24} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Filter Laporan</h2>
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
      <div className="card card-elevated">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-xl mr-3">
              <Factory className="text-green-600" size={24} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Data Laporan</h2>
          </div>
          <button 
            onClick={handleExport} 
            disabled={isExporting}
            className="btn btn-success shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            <span>{isExporting ? 'Mengekspor...' : 'Export Excel'}</span>
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
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center">
            <FileText className="mr-2" size={20} />
            Informasi Laporan
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start">
              <span className="font-bold mr-2">•</span>
              <span>Laporan ini menampilkan hasil pressdryer per mesin per tanggal</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">•</span>
              <span>Pallet masuk adalah jumlah batch yang diproses</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">•</span>
              <span>Persentase OK dihitung dari: (Total OK / Total Masuk) × 100%</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">•</span>
              <span>Export Excel untuk analisis lebih detail</span>
            </li>
          </ul>
        </div>

        <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
          <h3 className="font-bold text-green-900 mb-3 flex items-center">
            <Factory className="mr-2" size={20} />
            Standar Kualitas
          </h3>
          <ul className="text-sm text-green-800 space-y-2">
            <li className="flex items-center">
              <span className="font-bold mr-2">•</span>
              <span className="badge badge-success text-xs mr-2">≥ 90%</span>
              <span>Excellent (Sangat Baik)</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2">•</span>
              <span className="badge badge-warning text-xs mr-2">75-89%</span>
              <span>Good (Baik)</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2">•</span>
              <span className="badge badge-danger text-xs mr-2">&lt; 75%</span>
              <span>Need Improvement (Perlu Perbaikan)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}