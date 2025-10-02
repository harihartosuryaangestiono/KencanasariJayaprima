import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pressdryerAPI } from '../../utils/api';
import { Factory } from 'lucide-react';

export default function Pressdryer() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    mesin_id: '',
    pallet_id: '',
    jumlah_masuk: '',
    hasil_ok: '',
    hasil_reject: '',
    keterangan: '',
  });

  const { data: mesinList } = useQuery({
    queryKey: ['mesin-pressdryer'],
    queryFn: async () => {
      const response = await pressdryerAPI.getMesin();
      return response.data.data;
    },
  });

  const { data: coreAvailable } = useQuery({
    queryKey: ['core-available'],
    queryFn: async () => {
      const response = await pressdryerAPI.getCoreAvailable();
      return response.data.data;
    },
  });

  const processMutation = useMutation({
    mutationFn: pressdryerAPI.process,
    onSuccess: () => {
      queryClient.invalidateQueries(['core-available']);
      alert('Proses pressdryer berhasil dicatat');
      resetForm();
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Gagal memproses');
    },
  });

  const resetForm = () => {
    setFormData({
      mesin_id: '',
      pallet_id: '',
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
      mesin_id: parseInt(formData.mesin_id),
      pallet_id: parseInt(formData.pallet_id),
      jumlah_masuk: parseFloat(formData.jumlah_masuk),
      hasil_ok: parseFloat(formData.hasil_ok),
      hasil_reject: parseFloat(formData.hasil_reject),
    };

    processMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pressdryer</h1>
        <p className="text-gray-600 mt-1">Proses CORE dari Gudang A ke Pressdryer</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card">
          <div className="flex items-center mb-6">
            <Factory className="text-blue-600 mr-3" size={28} />
            <h2 className="text-xl font-bold">Form Proses Pressdryer</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Mesin Pressdryer *</label>
              <select
                value={formData.mesin_id}
                onChange={(e) => setFormData({ ...formData, mesin_id: e.target.value })}
                className="input"
                required
              >
                <option value="">Pilih Mesin</option>
                {mesinList?.map((mesin) => (
                  <option key={mesin.id} value={mesin.id}>
                    {mesin.nama} (Mesin {mesin.nomor})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Pallet CORE *</label>
              <select
                value={formData.pallet_id}
                onChange={(e) => setFormData({ ...formData, pallet_id: e.target.value })}
                className="input"
                required
              >
                <option value="">Pilih Pallet</option>
                {coreAvailable?.map((core) => (
                  <option key={core.id} value={core.id}>
                    {core.supplier_nama} - {core.ketebalan}mm - {core.jumlah} lembar
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
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={processMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {processMutation.isPending ? 'Memproses...' : 'Proses ke Gudang B'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Core Available */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">CORE Siap Diproses</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {coreAvailable?.map((core) => (
              <div key={core.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{core.supplier_nama}</p>
                    <p className="text-sm text-gray-600">Ketebalan: {core.ketebalan} mm</p>
                    <span className="badge badge-success mt-2">{core.status}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{core.jumlah}</p>
                    <p className="text-xs text-gray-500">{core.satuan}</p>
                  </div>
                </div>
              </div>
            ))}
            {coreAvailable?.length === 0 && (
              <p className="text-center text-gray-500 py-8">Tidak ada CORE yang siap diproses</p>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Informasi Pressdryer</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Hanya CORE dengan status OK yang bisa diproses</li>
          <li>• Hasil OK akan otomatis masuk ke Gudang B</li>
          <li>• Total hasil (OK + Reject) tidak boleh melebihi jumlah masuk</li>
        </ul>
      </div>
    </div>
  );
}