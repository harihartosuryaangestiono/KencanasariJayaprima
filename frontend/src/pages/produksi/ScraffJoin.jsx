import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { produksiAPI } from '../../utils/api';
import { Rows, Package } from 'lucide-react';

export default function ScraffJoin() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    bahan_id: '',
    jumlah_masuk: '',
    hasil_4x4: '',
    hasil_reject: '',
    arah_serat: 'dibalik',
    keterangan: '',
  });

  const { data: gudangB } = useQuery({
    queryKey: ['gudang-b'],
    queryFn: async () => {
      const response = await produksiAPI.getGudangB();
      return response.data.data;
    },
  });

  const scraffJoinMutation = useMutation({
    mutationFn: produksiAPI.scraffJoin,
    onSuccess: () => {
      queryClient.invalidateQueries(['gudang-b']);
      alert('Proses scraff join berhasil dicatat');
      resetForm();
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Gagal memproses scraff join');
    },
  });

  const resetForm = () => {
    setFormData({
      bahan_id: '',
      jumlah_masuk: '',
      hasil_4x4: '',
      hasil_reject: '',
      arah_serat: 'dibalik',
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

    scraffJoinMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Scraff Join 4x4</h1>
        <p className="text-gray-600 mt-1">Proses scraff join dari Gudang B ke Gudang C (arah serat dibalik)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card">
          <div className="flex items-center mb-6">
            <Rows className="text-blue-600 mr-3" size={28} />
            <h2 className="text-xl font-bold">Form Scraff Join</h2>
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
              <p className="text-xs text-gray-500 mt-1">Format standar 4x4 feet dengan arah serat dibalik</p>
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
              <label className="label">Arah Serat *</label>
              <select
                value={formData.arah_serat}
                onChange={(e) => setFormData({ ...formData, arah_serat: e.target.value })}
                className="input"
                required
              >
                <option value="dibalik">Dibalik (Default)</option>
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
                <option value="silang">Silang</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Scraff join biasanya menggunakan arah serat dibalik</p>
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
                disabled={scraffJoinMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {scraffJoinMutation.isPending ? 'Memproses...' : 'Proses ke Gudang C'}
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
              <div key={bahan.id} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
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

      <div className="card bg-purple-50 border-purple-200">
        <h3 className="font-semibold text-purple-900 mb-2">Informasi Scraff Join</h3>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Scraff Join adalah teknik penyambungan dengan mengubah arah serat kayu</li>
          <li>• Arah serat dibalik untuk meningkatkan kekuatan plywood</li>
          <li>• Menghasilkan format standar 4x4 feet</li>
          <li>• Hanya bahan jenis CORE yang bisa diproses</li>
          <li>• Hasil OK akan masuk ke Gudang C untuk proses selanjutnya</li>
        </ul>
      </div>
    </div>
  );
}