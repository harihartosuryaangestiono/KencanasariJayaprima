import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { produksiAPI } from '../../utils/api';
import { Layers, Info } from 'lucide-react';

export default function SettingPlywood() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    tipe_plywood: '3MM',
    shortcore_qty: '',
    longcore_qty: '',
    face_qty: '',
    back_qty: '',
    lem_qty: '',
    hasil_ok: '',
    hasil_reject: '',
    keterangan: '',
  });

  const { data: gudangC } = useQuery({
    queryKey: ['gudang-c'],
    queryFn: async () => {
      const response = await produksiAPI.getGudangC();
      return response.data.data;
    },
  });

  const settingMutation = useMutation({
    mutationFn: produksiAPI.settingPlywood,
    onSuccess: () => {
      queryClient.invalidateQueries(['gudang-c']);
      alert('Setting plywood berhasil dicatat');
      resetForm();
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Gagal menyimpan setting plywood');
    },
  });

  const resetForm = () => {
    setFormData({
      tipe_plywood: '3MM',
      shortcore_qty: '',
      longcore_qty: '',
      face_qty: '',
      back_qty: '',
      lem_qty: '',
      hasil_ok: '',
      hasil_reject: '',
      keterangan: '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      shortcore_qty: parseFloat(formData.shortcore_qty) || 0,
      longcore_qty: parseFloat(formData.longcore_qty) || 0,
      face_qty: parseFloat(formData.face_qty) || 0,
      back_qty: parseFloat(formData.back_qty) || 0,
      lem_qty: parseFloat(formData.lem_qty) || 0,
      hasil_ok: parseFloat(formData.hasil_ok) || 0,
      hasil_reject: parseFloat(formData.hasil_reject) || 0,
    };

    settingMutation.mutate(data);
  };

  // Formula referensi untuk setiap tipe
  const formulas = {
    '3MM': {
      shortcore: 1,
      longcore: 0,
      face: 1,
      back: 1,
      description: '1 shortcore + 1 face + 1 back'
    },
    '9MM': {
      shortcore: 2,
      longcore: 1,
      face: 1,
      back: 1,
      description: '2 shortcore + 1 longcore (2.9mm) + 0.3 face + 0.3 back'
    },
    '29MM': {
      shortcore: 2,
      longcore: 1,
      face: 1,
      back: 1,
      description: '2 shortcore + 1 longcore (2.9mm) + 0.3 face + 0.3 back'
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Setting Plywood</h1>
        <p className="text-gray-600 mt-1">Kombinasi bahan dari Gudang C untuk produksi plywood</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center mb-6">
            <Layers className="text-blue-600 mr-3" size={28} />
            <h2 className="text-xl font-bold">Form Setting Plywood</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Tipe Plywood *</label>
              <select
                value={formData.tipe_plywood}
                onChange={(e) => setFormData({ ...formData, tipe_plywood: e.target.value })}
                className="input"
                required
              >
                <option value="3MM">3MM</option>
                <option value="9MM">9MM</option>
                <option value="29MM">29MM</option>
              </select>
            </div>

            {/* Info Formula */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="text-blue-600 mr-2 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Formula {formData.tipe_plywood}:
                  </p>
                  <p className="text-sm text-blue-800">
                    {formulas[formData.tipe_plywood].description}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Shortcore (lembar) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.shortcore_qty}
                  onChange={(e) => setFormData({ ...formData, shortcore_qty: e.target.value })}
                  className="input"
                  placeholder={`Standar: ${formulas[formData.tipe_plywood].shortcore}`}
                  required
                />
              </div>

              <div>
                <label className="label">Longcore (lembar)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.longcore_qty}
                  onChange={(e) => setFormData({ ...formData, longcore_qty: e.target.value })}
                  className="input"
                  placeholder={`Standar: ${formulas[formData.tipe_plywood].longcore}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.tipe_plywood === '3MM' ? 'Tidak diperlukan untuk 3MM' : 'Ketebalan 2.9mm'}
                </p>
              </div>

              <div>
                <label className="label">Face (lembar) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.face_qty}
                  onChange={(e) => setFormData({ ...formData, face_qty: e.target.value })}
                  className="input"
                  placeholder={formData.tipe_plywood === '3MM' ? '1.0' : '0.3'}
                  required
                />
              </div>

              <div>
                <label className="label">Back (lembar) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.back_qty}
                  onChange={(e) => setFormData({ ...formData, back_qty: e.target.value })}
                  className="input"
                  placeholder={formData.tipe_plywood === '3MM' ? '1.0' : '0.3'}
                  required
                />
              </div>

              <div>
                <label className="label">Lem (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.lem_qty}
                  onChange={(e) => setFormData({ ...formData, lem_qty: e.target.value })}
                  className="input"
                  placeholder="Jumlah lem"
                  required
                />
              </div>

              <div>
                <label className="label">Hasil OK (lembar)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hasil_ok}
                  onChange={(e) => setFormData({ ...formData, hasil_ok: e.target.value })}
                  className="input"
                  placeholder="0"
                />
              </div>

              <div className="col-span-2">
                <label className="label">Hasil Reject (lembar)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hasil_reject}
                  onChange={(e) => setFormData({ ...formData, hasil_reject: e.target.value })}
                  className="input"
                  placeholder="0"
                />
              </div>
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
                disabled={settingMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {settingMutation.isPending ? 'Menyimpan...' : 'Simpan Setting'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Bahan di Gudang C */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Bahan di Gudang C</h2>
          <div className="space-y-3 max-h-[700px] overflow-y-auto">
            {gudangC?.map((bahan) => (
              <div key={bahan.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{bahan.jenis}</p>
                    <p className="text-xs text-gray-600">{bahan.supplier_nama}</p>
                    {bahan.ketebalan && (
                      <p className="text-xs text-gray-500">{bahan.ketebalan}mm</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {parseFloat(bahan.jumlah).toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">{bahan.satuan}</p>
                  </div>
                </div>
              </div>
            ))}
            {gudangC?.length === 0 && (
              <p className="text-center text-gray-500 py-8 text-sm">Tidak ada bahan di Gudang C</p>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-green-50 border-green-200">
        <h3 className="font-semibold text-green-900 mb-2">Informasi Setting Plywood</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• <strong>3MM:</strong> Menggunakan 1 shortcore + 1 face + 1 back</li>
          <li>• <strong>9MM/29MM:</strong> Menggunakan 2 shortcore + 1 longcore (2.9mm) + 0.3 face + 0.3 back</li>
          <li>• Pastikan bahan tersedia di Gudang C sebelum melakukan setting</li>
          <li>• Catat penggunaan lem untuk laporan harian</li>
          <li>• Setelah setting, lanjutkan ke proses Hotpress</li>
        </ul>
      </div>
    </div>
  );
}