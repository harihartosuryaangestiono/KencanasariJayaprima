import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { laporanAPI } from '../../utils/api';
import { useToast } from '../../components/Toast';
import { FileText, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function LaporanFaceback() {
  const toast = useToast();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const { data: laporan, isLoading, refetch } = useQuery({
    queryKey: ['laporan-faceback', startDate, endDate],
    queryFn: async () => {
      const response = await laporanAPI.faceback({ start_date: startDate, end_date: endDate });
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

  const handleExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      const response = await laporanAPI.exportFaceback({ 
        start_date: startDate || undefined, 
        end_date: endDate || undefined
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
      const fileName = `Laporan_FaceBack_${startDate || 'all'}_${endDate || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`;
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
        <h1 className="page-title">Laporan Face & Back</h1>
        <p className="page-subtitle">Laporan penggunaan material face dan back</p>
      </div>

      {/* Filter */}
      <div className="card card-elevated">
        <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
          <div className="bg-blue-100 p-3 rounded-xl mr-3">
            <Calendar className="text-blue-600" size={24} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Filter Tanggal</h2>
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

      {/* Table */}
      <div className="card card-elevated">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-xl mr-3">
              <FileText className="text-green-600" size={24} />
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
                  <th>Jenis</th>
                  <th>Face (lembar)</th>
                  <th>Back (lembar)</th>
                  <th>OK</th>
                  <th>Reject</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {laporan?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.tanggal ? format(new Date(item.tanggal), 'dd MMM yyyy') : '-'}</td>
                    <td>
                      <span className="badge badge-primary">{item.jenis}</span>
                    </td>
                    <td className="font-medium">
                      {parseFloat(item.face_jumlah || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="font-medium">
                      {parseFloat(item.back_jumlah || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="text-green-600 font-medium">
                      {parseFloat(item.ok_jumlah || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="text-red-600 font-medium">
                      {parseFloat(item.reject_jumlah || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="font-bold">
                      {parseFloat(item.face_jumlah || 0 + item.back_jumlah || 0).toLocaleString('id-ID')}
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
                      {laporan.reduce((sum, item) => sum + parseFloat(item.face_jumlah || 0), 0).toLocaleString('id-ID')}
                    </td>
                    <td>
                      {laporan.reduce((sum, item) => sum + parseFloat(item.back_jumlah || 0), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="text-green-600">
                      {laporan.reduce((sum, item) => sum + parseFloat(item.ok_jumlah || 0), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="text-red-600">
                      {laporan.reduce((sum, item) => sum + parseFloat(item.reject_jumlah || 0), 0).toLocaleString('id-ID')}
                    </td>
                    <td>
                      {laporan.reduce((sum, item) => sum + parseFloat(item.face_jumlah || 0) + parseFloat(item.back_jumlah || 0), 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <h3 className="font-bold text-blue-900 mb-3 flex items-center">
          <FileText className="mr-2" size={20} />
          Informasi Laporan
        </h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start">
            <span className="font-bold mr-2">•</span>
            <span>Laporan ini menampilkan penggunaan material face dan back per tanggal</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">•</span>
            <span>Face dan back digunakan untuk lapisan luar plywood</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">•</span>
            <span>Status <strong className="text-green-700">OK</strong> menunjukkan material yang lolos QC</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">•</span>
            <span>Status <strong className="text-red-700">Reject</strong> menunjukkan material yang tidak lolos QC</span>
          </li>
        </ul>
      </div>
    </div>
  );
}