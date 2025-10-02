import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { laporanAPI } from '../../utils/api';
import { FileText, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function LaporanFaceback() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Laporan Face & Back</h1>
        <p className="text-gray-600 mt-1">Laporan penggunaan material face dan back</p>
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

      {/* Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <FileText className="text-green-600 mr-3" size={24} />
            <h2 className="text-lg font-bold">Data Laporan</h2>
          </div>
          <button className="btn btn-success flex items-center text-sm">
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

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Informasi Laporan</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Laporan ini menampilkan penggunaan material face dan back per tanggal</li>
          <li>• Face dan back digunakan untuk lapisan luar plywood</li>
          <li>• Status OK menunjukkan material yang lolos QC</li>
          <li>• Status Reject menunjukkan material yang tidak lolos QC</li>
        </ul>
      </div>
    </div>
  );
}