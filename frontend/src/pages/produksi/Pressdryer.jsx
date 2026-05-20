import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pressdryerAPI } from '../../utils/api';
import { useToast } from '../../components/Toast';
import { Factory, Package } from 'lucide-react';

export default function Pressdryer() {
  const queryClient = useQueryClient();
  const toast = useToast();
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
      toast.success('Proses pressdryer berhasil dicatat');
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Gagal memproses pressdryer');
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
    
    // Validasi
    const jumlahMasuk = parseFloat(formData.jumlah_masuk);
    const hasilOk = parseFloat(formData.hasil_ok);
    const hasilReject = parseFloat(formData.hasil_reject);
    
    if (hasilOk + hasilReject > jumlahMasuk) {
      toast.error('Total hasil (OK + Reject) tidak boleh melebihi jumlah masuk');
      return;
    }
    
    const data = {
      ...formData,
      mesin_id: parseInt(formData.mesin_id),
      pallet_id: parseInt(formData.pallet_id),
      jumlah_masuk: jumlahMasuk,
      hasil_ok: hasilOk,
      hasil_reject: hasilReject,
    };

    processMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Pressdryer</h1>
        <p className="page-subtitle">Proses CORE dari Gudang A ke Pressdryer</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card card-elevated">
          <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
            <div className="bg-blue-100 p-3 rounded-xl mr-3">
              <Factory className="text-blue-600" size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Form Proses Pressdryer</h2>
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
        <div className="card card-elevated">
          <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
            <div className="bg-green-100 p-3 rounded-xl mr-3">
              <Package className="text-green-600" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">CORE Siap Diproses</h2>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {coreAvailable?.map((core) => (
              <div key={core.id} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{core.supplier_nama}</p>
                    <p className="text-sm text-gray-600 font-medium mt-1">Ketebalan: {core.ketebalan} mm</p>
                    <span className="badge badge-success mt-2">{core.status}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{core.jumlah}</p>
                    <p className="text-xs text-gray-500 font-medium">{core.satuan}</p>
                  </div>
                </div>
              </div>
            ))}
            {coreAvailable?.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500 font-medium">Tidak ada CORE yang siap diproses</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <h3 className="font-bold text-blue-900 mb-3 flex items-center">
          <Factory className="mr-2" size={20} />
          Informasi Pressdryer
        </h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start">
            <span className="font-bold mr-2">•</span>
            <span>Hanya CORE dengan status OK yang bisa diproses</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">•</span>
            <span>Hasil OK akan otomatis masuk ke Gudang B</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">•</span>
            <span>Total hasil (OK + Reject) tidak boleh melebihi jumlah masuk</span>
          </li>
        </ul>
      </div>
    </div>
  );
}