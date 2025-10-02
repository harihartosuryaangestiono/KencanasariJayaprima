import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { produksiAPI } from '../../utils/api';
import { Wrench, Package } from 'lucide-react';

export default function Repair() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    bahan_id: '',
    jumlah_masuk: '',
    hasil_ok: '',
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

  const repairMutation = useMutation({
    mutationFn: produksiAPI.repair,
    onSuccess: () => {
      queryClient.invalidateQueries(['gudang-b']);
      alert('Proses repair berhasil dicatat');
      resetForm();
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Gagal memproses repair');
    },
  });

  const resetForm = () => {
    setFormData({
      bahan_id: '',
      jumlah_masuk: '',
      hasil_ok: '',
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
      hasil_ok: parseFloat(formData.hasil_ok),
      hasil_reject: parseFloat(formData.hasil_reject),
    };

    repairMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Repair</h1>
        <p className="text-gray-600 mt-1">Proses repair bahan dari Gudang B ke Gudang C</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card">
          <div className="flex items-center mb-6">
            <Wrench className="text-blue-600 mr-3" size={28} />
            <h2 className="text-xl font-bold">Form Proses Repair</h2>
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
                {gudangB?.map((bahan) => (
                  <option key={bahan.id} value={bahan.id}>
                    {bahan.jenis} - {bahan.supplier_nama} - {bahan.ketebalan}mm - {bahan.jumlah} {bahan.satuan}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Jumlah Masuk *</label>
              <input
                type="number"
                step="0.01"
                value={formData.jumlah_masuk}
                onChange={(e) => setFormData({ ...formData, jumlah_masuk: e.target.value })}
                className="input"
                placeholder="Jumlah yang akan di-repair"
                required
              />
            </div>

            <div>
              <label className="label">Hasil OK *</label>
              <input
                type="number"
                step="0.01"
                value={formData.hasil_ok}
                onChange={(e) => setFormData({ ...formData, hasil_ok: e.target.value })}
                className="input"
                placeholder="Jumlah hasil OK"
                required
              />
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
                disabled={repairMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {repairMutation.isPending ? 'Memproses...' : 'Proses ke Gudang C'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Bahan di Gudang B */}
        <div className="card">
          <div className="flex items-center mb-6">
            <Package className="text-green-600 mr-3" size={28} />
            <h2 className="text-xl font-bold">Bahan di Gudang B</h2>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {gudangB?.map((bahan) => (
              <div key={bahan.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
            {gudangB?.length === 0 && (
              <p className="text-center text-gray-500 py-8">Tidak ada bahan di Gudang B</p>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Informasi Repair</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Bahan diambil dari Gudang B (hasil pressdryer)</li>
          <li>• Hasil OK akan masuk ke Gudang C</li>
          <li>• Total hasil (OK + Reject) sebaiknya tidak melebihi jumlah masuk</li>
          <li>• Gudang C adalah tempat bahan siap untuk setting plywood</li>
        </ul>
      </div>
    </div>
  );
}