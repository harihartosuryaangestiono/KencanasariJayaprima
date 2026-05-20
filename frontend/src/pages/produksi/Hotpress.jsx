import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { produksiAPI } from '../../utils/api';
import { useToast } from '../../components/Toast';
import { Flame, CheckCircle } from 'lucide-react';

export default function Hotpress() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [formData, setFormData] = useState({
    setting_plywood_id: '',
    jumlah_masuk: '',
    hasil_ok: '',
    hasil_reject: '',
    keterangan: '',
  });

  // Query untuk mendapatkan setting plywood yang sudah dibuat
  const { data: settingList, isLoading: isLoadingSetting } = useQuery({
    queryKey: ['setting-plywood-list'],
    queryFn: async () => {
      try {
        const response = await produksiAPI.getSettingPlywoodList();
        return response.data.data || [];
      } catch (error) {
        // Jika endpoint belum ada, return empty array
        console.warn('Endpoint setting-plywood-list belum tersedia:', error);
        return [];
      }
    },
    retry: 1,
  });

  const hotpressMutation = useMutation({
    mutationFn: produksiAPI.hotpress,
    onSuccess: () => {
      queryClient.invalidateQueries(['setting-plywood-list']);
      toast.success('Proses hotpress berhasil dicatat. Hasil OK akan masuk ke Gudang Finished!');
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Gagal memproses hotpress');
    },
  });

  const resetForm = () => {
    setFormData({
      setting_plywood_id: '',
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
      setting_plywood_id: parseInt(formData.setting_plywood_id),
      jumlah_masuk: jumlahMasuk,
      hasil_ok: hasilOk,
      hasil_reject: hasilReject,
    };

    hotpressMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hotpress</h1>
        <p className="text-gray-600 mt-1">Proses hotpress ke Finished Goods</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card">
          <div className="flex items-center mb-6">
            <Flame className="text-orange-600 mr-3" size={28} />
            <h2 className="text-xl font-bold">Form Hotpress</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Setting Plywood *</label>
              <select
                value={formData.setting_plywood_id}
                onChange={(e) => setFormData({ ...formData, setting_plywood_id: e.target.value })}
                className="input"
                required
                disabled={isLoadingSetting}
              >
                <option value="">{isLoadingSetting ? 'Memuat...' : 'Pilih Setting Plywood'}</option>
                {settingList?.map((setting) => (
                  <option key={setting.id} value={setting.id}>
                    ID: {setting.id} - {setting.tipe_plywood} - {setting.hasil_ok || 0} OK
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Pilih setting plywood yang sudah dibuat sebelumnya
              </p>
              {!isLoadingSetting && settingList?.length === 0 && (
                <p className="text-xs text-yellow-600 mt-1">
                  Belum ada setting plywood. Buat setting plywood terlebih dahulu.
                </p>
              )}
            </div>

            <div>
              <label className="label">Jumlah Masuk (lembar) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.jumlah_masuk}
                onChange={(e) => setFormData({ ...formData, jumlah_masuk: e.target.value })}
                className="input"
                placeholder="Jumlah yang akan di-hotpress"
                required
              />
            </div>

            <div>
              <label className="label">Hasil OK (lembar) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.hasil_ok}
                onChange={(e) => setFormData({ ...formData, hasil_ok: e.target.value })}
                className="input"
                placeholder="Jumlah hasil OK"
                required
              />
              <p className="text-xs text-green-600 mt-1">
                Hasil OK akan otomatis masuk ke Gudang Finished
              </p>
            </div>

            <div>
              <label className="label">Hasil Reject (lembar) *</label>
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
                rows="4"
                placeholder="Keterangan tambahan (suhu, tekanan, durasi, dll)"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={hotpressMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {hotpressMutation.isPending ? 'Memproses...' : 'Proses Hotpress'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Info & Flowchart */}
        <div className="space-y-6">
          <div className="card bg-orange-50 border-orange-200">
            <div className="flex items-center mb-4">
              <CheckCircle className="text-orange-600 mr-3" size={24} />
              <h3 className="font-semibold text-orange-900">Proses Hotpress</h3>
            </div>
            <ul className="text-sm text-orange-800 space-y-2">
              <li>• Hotpress adalah tahap akhir pembuatan plywood</li>
              <li>• Menggunakan suhu dan tekanan tinggi untuk merekatkan lapisan</li>
              <li>• Hasil OK akan masuk ke Gudang Finished Goods</li>
              <li>• Hasil reject bisa masuk repair atau dibuang</li>
            </ul>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Alur Lengkap Produksi</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700">
                  1
                </div>
                <div className="ml-3">
                  <p className="font-medium">Input Bahan (PPIC)</p>
                  <p className="text-xs text-gray-500">Gudang A - Menunggu QC</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-700">
                  2
                </div>
                <div className="ml-3">
                  <p className="font-medium">QC Checklist</p>
                  <p className="text-xs text-gray-500">OK/Reject</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-700">
                  3
                </div>
                <div className="ml-3">
                  <p className="font-medium">Pressdryer</p>
                  <p className="text-xs text-gray-500">Gudang A → Gudang B</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center font-bold text-yellow-700">
                  4
                </div>
                <div className="ml-3">
                  <p className="font-medium">Repair/Core Builder/Scraff Join</p>
                  <p className="text-xs text-gray-500">Gudang B → Gudang C</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center font-bold text-purple-700">
                  5
                </div>
                <div className="ml-3">
                  <p className="font-medium">Setting Plywood</p>
                  <p className="text-xs text-gray-500">Kombinasi bahan + lem</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center font-bold text-orange-700">
                  6
                </div>
                <div className="ml-3">
                  <p className="font-medium">Hotpress (Anda di sini)</p>
                  <p className="text-xs text-gray-500">→ Gudang Finished</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center font-bold text-red-700">
                  7
                </div>
                <div className="ml-3">
                  <p className="font-medium">Cutting → Grading</p>
                  <p className="text-xs text-gray-500">Quality control final</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-green-50 border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">Tips Hotpress</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Pastikan suhu dan tekanan sesuai spesifikasi</li>
              <li>• Catat durasi hotpress untuk QC</li>
              <li>• Periksa hasil sebelum menandai OK</li>
              <li>• Hasil cacat masuk kategori reject</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}