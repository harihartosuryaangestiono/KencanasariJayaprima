import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { produksiAPI } from '../../utils/api';
import { Grid3x3, Package } from 'lucide-react';

export default function CoreBuilder() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    bahan_id: '',
    jumlah_masuk: '',
    hasil_4x4: '',
    hasil_reject: '',
    keterangan: '',
  });

  const { data: gudangB } = useQuery({
    queryKey: ['gudang-b'],
    queryFn: async () => {
      const response = await produksiAPI.getGudangB();
      return response.data.data;
    },
  });

  const coreBuilderMutation = useMutation({
    mutationFn: produksiAPI.coreBuilder,
    onSuccess: () => {
      queryClient.invalidateQueries(['gudang-b']);
      alert('Proses core builder berhasil dicatat');
      resetForm();
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Gagal memproses core builder');
    },
  });

  const resetForm = () => {
    setFormData({
      bahan_id: '',
      jumlah_masuk: '',
      hasil_4x4: '',
      hasil_reject: '',
      keterangan: '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      bahan_id: parseInt(formData.bahan_id),
      jumlah_masuk: parseFloat(formData.jumlah_masuk),
      hasil_4x4: parseFloat(formData.hasil_4x4),
      hasil_reject: parseFloat(formData.hasil_reject),
    };

    coreBuilderMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Core Builder 4x4</h1>
        <p className="text-gray-600 mt-1">Proses core builder dari Gudang B ke Gudang C (format 4x4)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card">
          <div className="flex items-center mb-6">
            <Grid3x3 className="text-blue-600 mr-3" size={28} />
            <h2 className="text-xl font-bold">Form Core Builder</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Pilih Bahan dari Gudang B *</label>
              <select
                value={formData.bahan_id}
                onChange={(e) => setFormData({ ...formData, bahan_id: e.target.value })}
                className="input"
                required
              >
                <option value="">Pilih Bahan</option>
                {gudangB?.filter(b => b.jenis === 'CORE').map((bahan) => (
                  <option key={bahan.id} value={bahan.id}>
                    CORE - {bahan.supplier_nama} - {bahan.ketebalan}mm - {bahan.jumlah} {bahan.satuan}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hanya menampilkan bahan jenis CORE</p>
            </div>

            <div>
              <label className="label">Jumlah Masuk *</label>
              <input
                type="number"
                step="0.01"
                value={formData.jumlah_masuk}
                onChange={(e) => setFormData({ ...formData, jumlah_masuk: e.target.value })}
                className="input"
                placeholder="Jumlah yang akan diproses"
                required
              />
            </div>

            <div>
              <label className="label">Hasil 4x4 *</label>
              <input
                type="number"
                step="0.01"
                value={formData.hasil_4x4}
                onChange={(e) => setFormData({ ...formData, hasil_4x4: e.target.value })}
                className="input"
                placeholder="Jumlah hasil 4x4"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format standar 4x4 feet</p>
            </div>

            <div>
              <label className="label">Hasil Reject *</label>
              <input
                type="number"
                step="0.01"
                value={formData.hasil_reject}
                onChange={(e) => setFormData({ ...formData, hasil_reject: e.target.value })}
                className="input"
                placeholder="Jumlah hasil reject"
                required
              />
            </div>

            <div>
              <label className="label">Keterangan</label>
              <textarea
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                className="input"
                rows="3"
                placeholder="Keterangan tambahan"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={coreBuilderMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {coreBuilderMutation.isPending ? 'Memproses...' : 'Proses ke Gudang C'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* CORE di Gudang B */}
        <div className="card">
          <div className="flex items-center mb-6">
            <Package className="text-green-600 mr-3" size={28} />
            <h2 className="text-xl font-bold">CORE di Gudang B</h2>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {gudangB?.filter(b => b.jenis === 'CORE').map((bahan) => (
              <div key={bahan.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{bahan.jenis}</p>
                    <p className="text-sm text-gray-600">{bahan.supplier_nama}</p>
                    {bahan.ketebalan && (
                      <p className="text-xs text-gray-500">Ketebalan: {bahan.ketebalan} mm</p>
                    )}
                    <span className="badge badge-success mt-2">{bahan.status}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {parseFloat(bahan.jumlah).toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-gray-500">{bahan.satuan}</p>
                  </div>
                </div>
              </div>
            ))}
            {gudangB?.filter(b => b.jenis === 'CORE').length === 0 && (
              <p className="text-center text-gray-500 py-8">Tidak ada CORE di Gudang B</p>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Informasi Core Builder</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Core Builder mengubah core menjadi ukuran standar 4x4 feet</li>
          <li>• Hanya bahan jenis CORE yang bisa diproses</li>
          <li>• Hasil OK akan masuk ke Gudang C</li>
          <li>• Bahan di Gudang C siap untuk proses setting plywood</li>
        </ul>
      </div>
    </div>
  );
}