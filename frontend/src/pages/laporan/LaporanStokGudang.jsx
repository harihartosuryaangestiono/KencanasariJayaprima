import { useQuery } from '@tanstack/react-query';
import { laporanAPI } from '../../utils/api';
import { Package, Warehouse, RefreshCw, AlertTriangle } from 'lucide-react';

export default function LaporanStokGudang() {
  const { data: stokGudang, isLoading, refetch } = useQuery({
    queryKey: ['laporan-stok-gudang'],
    queryFn: async () => {
      const response = await laporanAPI.stokGudang();
      return response.data.data;
    },
    refetchInterval: 30000, // Auto refresh every 30 seconds
  });

  // Group data by gudang
  const groupedByGudang = stokGudang?.reduce((acc, item) => {
    const gudangName = item.gudang_nama;
    if (!acc[gudangName]) {
      acc[gudangName] = [];
    }
    acc[gudangName].push(item);
    return acc;
  }, {}) || {};

  const gudangColors = {
    'Gudang A': 'bg-blue-50 border-blue-200',
    'Gudang B': 'bg-green-50 border-green-200',
    'Gudang C': 'bg-orange-50 border-orange-200',
    'Gudang Finished': 'bg-purple-50 border-purple-200',
  };

  const gudangIcons = {
    'Gudang A': '📦',
    'Gudang B': '🏭',
    'Gudang C': '🔧',
    'Gudang Finished': '✅',
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="page-title">Laporan Stok Gudang</h1>
            <p className="page-subtitle">Real-time stok bahan baku per gudang</p>
          </div>
          <button 
            onClick={() => refetch()} 
            className="btn btn-primary shadow-lg"
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.keys(groupedByGudang).map((gudangName) => {
              const items = groupedByGudang[gudangName];
              const totalStok = items.reduce((sum, item) => sum + parseFloat(item.total_stok || 0), 0);
              const totalBatch = items.reduce((sum, item) => sum + parseInt(item.jumlah_batch || 0), 0);

              return (
                <div key={gudangName} className={`card card-elevated ${gudangColors[gudangName] || 'bg-gray-50'} border-2 relative overflow-hidden group`}>
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{gudangIcons[gudangName] || '📦'}</span>
                      <div className="bg-white/50 p-2 rounded-lg">
                        <Warehouse className="text-gray-600" size={24} />
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-3">{gudangName}</h3>
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 font-medium mb-1">Total Batch: <span className="font-bold text-gray-900">{totalBatch}</span></p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {totalStok.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-gray-500 font-medium mt-1">lembar</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail per Gudang */}
          {Object.keys(groupedByGudang).map((gudangName) => (
            <div key={gudangName} className="card card-elevated">
              <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                <span className="text-3xl mr-3">{gudangIcons[gudangName] || '📦'}</span>
                <h2 className="text-xl font-bold text-gray-900">{gudangName}</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Jenis Bahan</th>
                      <th>Ketebalan (mm)</th>
                      <th>Satuan</th>
                      <th>Total Stok</th>
                      <th>Jumlah Batch</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedByGudang[gudangName].map((item, index) => (
                      <tr key={index}>
                        <td className="font-semibold">{item.jenis}</td>
                        <td>{item.ketebalan || '-'}</td>
                        <td>{item.satuan}</td>
                        <td className="font-bold text-lg">
                          {parseFloat(item.total_stok || 0).toLocaleString('id-ID')}
                        </td>
                        <td>
                          <span className="badge badge-gray">{item.jumlah_batch} batch</span>
                        </td>
                        <td>
                          <span className={`badge ${
                            item.status === 'OK' ? 'badge-success' :
                            item.status === 'MENUNGGU QC' ? 'badge-warning' :
                            'badge-gray'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan="3">SUBTOTAL {gudangName}</td>
                      <td className="text-lg">
                        {groupedByGudang[gudangName].reduce((sum, item) => 
                          sum + parseFloat(item.total_stok || 0), 0
                        ).toLocaleString('id-ID')}
                      </td>
                      <td>
                        {groupedByGudang[gudangName].reduce((sum, item) => 
                          sum + parseInt(item.jumlah_batch || 0), 0
                        )} batch
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}

          {/* Total Summary */}
          <div className="card card-elevated bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full -mr-32 -mt-32"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Total Stok Keseluruhan</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/60 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 font-medium mb-1">Total Lembar</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {stokGudang?.reduce((sum, item) => 
                        sum + parseFloat(item.total_stok || 0), 0
                      ).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 font-medium mb-1">Total Batch</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {stokGudang?.reduce((sum, item) => 
                        sum + parseInt(item.jumlah_batch || 0), 0
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/40 p-6 rounded-2xl">
                <Package size={64} className="text-blue-500" />
              </div>
            </div>
          </div>

          {/* Informasi & Alert */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center">
                <Package className="mr-2" size={20} />
                Informasi Stok
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span><strong>Gudang A:</strong> Bahan baku mentah (sebelum/sesudah QC)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span><strong>Gudang B:</strong> Hasil pressdryer (siap repair/core builder)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span><strong>Gudang C:</strong> Hasil repair/core builder (siap setting)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span><strong>Gudang Finished:</strong> Barang jadi siap distribusi</span>
                </li>
              </ul>
            </div>

            <div className="card bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
              <h3 className="font-bold text-yellow-900 mb-3 flex items-center">
                <AlertTriangle className="mr-2" size={20} />
                Status Bahan
              </h3>
              <ul className="text-sm text-yellow-800 space-y-2">
                <li className="flex items-center">
                  <span className="font-bold mr-2">•</span>
                  <span className="badge badge-warning text-xs mr-2">MENUNGGU QC</span>
                  <span>Belum dicek kualitas</span>
                </li>
                <li className="flex items-center">
                  <span className="font-bold mr-2">•</span>
                  <span className="badge badge-success text-xs mr-2">OK</span>
                  <span>Lolos QC, siap diproses</span>
                </li>
                <li className="flex items-center">
                  <span className="font-bold mr-2">•</span>
                  <span className="badge badge-danger text-xs mr-2">REJECT</span>
                  <span>Tidak lolos QC</span>
                </li>
                <li className="flex items-start mt-3 pt-2 border-t border-yellow-200">
                  <span className="font-bold mr-2">•</span>
                  <span>Data diupdate real-time setiap 30 detik</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Stock Alert */}
          {stokGudang?.some(item => parseFloat(item.total_stok) < 10) && (
            <div className="card bg-red-50 border-red-200">
              <div className="flex items-start">
                <AlertTriangle className="text-red-600 mr-3 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">Peringatan Stok Rendah!</h3>
                  <p className="text-sm text-red-800">
                    Beberapa bahan memiliki stok rendah (kurang dari 10 {stokGudang?.find(item => parseFloat(item.total_stok) < 10)?.satuan}). 
                    Segera lakukan restock untuk menghindari gangguan produksi.
                  </p>
                  <div className="mt-3">
                    {stokGudang?.filter(item => parseFloat(item.total_stok) < 10).map((item, index) => (
                      <div key={index} className="inline-block mr-2 mb-2">
                        <span className="badge badge-danger">
                          {item.jenis} di {item.gudang_nama}: {parseFloat(item.total_stok).toFixed(0)} {item.satuan}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}