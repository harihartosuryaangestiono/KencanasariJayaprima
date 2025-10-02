import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierAPI, bahanAPI } from '../../utils/api';
import { PackagePlus, CheckCircle } from 'lucide-react';

export default function InputBahan() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    supplier_id: '',
    jenis: 'CORE',
    ketebalan: '',
    jumlah: '',
    satuan: 'lembar',
    keterangan: '',
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await supplierAPI.getAll();
      return response.data.data;
    },
  });

  const { data: recentBahan } = useQuery({
    queryKey: ['recent-bahan'],
    queryFn: async () => {
      const response = await bahanAPI.getAll({ status: 'MENUNGGU QC' });
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: bahanAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['recent-bahan']);
      alert('Bahan baku berhasil ditambahkan ke Gudang A');
      resetForm();
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Gagal menambahkan bahan');
    },
  });

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      jenis: 'CORE',
      ketebalan: '',
      jumlah: '',
      satuan: 'lembar',
      keterangan: '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      supplier_id: parseInt(formData.supplier_id),
      ketebalan: formData.ketebalan ? parseFloat(formData.ketebalan) : null,
      jumlah: parseFloat(formData.jumlah),
    };

    createMutation.mutate(data);
  };

  const jenisBahan = [
    { value: 'CORE', label: 'Core' },
    { value: 'FACE', label: 'Face' },
    { value: 'BACK', label: 'Back' },
    { value: 'LONGCORE', label: 'Longcore' },
    { value: 'LEM', label: 'Lem' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Input Bahan Masuk</h1>
        <p className="text-gray-600 mt-1">Input bahan baku dari supplier ke Gudang A</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Input */}
        <div className="card">
          <div className="flex items-center mb-6">
            <PackagePlus className="text-blue-600 mr-3" size={28} />
            <h2 className="text-xl font-bold text-gray-900">Form Input Bahan</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Supplier *</label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="input"
                required
              >
                <option value="">Pilih Supplier</option>
                {suppliers?.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Jenis Bahan *</label>
              <select
                value={formData.jenis}
                onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                className="input"
                required
              >
                {jenisBahan.map((jenis) => (
                  <option key={jenis.value} value={jenis.value}>
                    {jenis.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Ketebalan (mm)</label>
              <input
                type="number"
                step="0.1"
                value={formData.ketebalan}
                onChange={(e) => setFormData({ ...formData, ketebalan: e.target.value })}
                className="input"
                placeholder="Contoh: 1.5"
              />
              <p className="text-xs text-gray-500 mt-1">Kosongkan jika bahan tidak memiliki ketebalan (seperti lem)</p>
            </div>

            <div>
              <label className="label">Jumlah *</label>
              <input
                type="number"
                step="0.01"
                value={formData.jumlah}
                onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                className="input"
                placeholder="Masukkan jumlah"
                required
              />
            </div>

            <div>
              <label className="label">Satuan *</label>
              <select
                value={formData.satuan}
                onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                className="input"
                required
              >
                <option value="lembar">Lembar</option>
                <option value="kg">Kilogram</option>
                <option value="liter">Liter</option>
                <option value="m3">Meter Kubik</option>
              </select>
            </div>

            <div>
              <label className="label">Keterangan</label>
              <textarea
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                className="input"
                rows="3"
                placeholder="Keterangan tambahan (opsional)"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {createMutation.isPending ? 'Menyimpan...' : 'Simpan ke Gudang A'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Recent Entries */}
        <div className="card">
          <div className="flex items-center mb-6">
            <CheckCircle className="text-green-600 mr-3" size={28} />
            <h2 className="text-xl font-bold text-gray-900">Bahan Menunggu QC</h2>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {recentBahan?.slice(0, 10).map((bahan) => (
              <div key={bahan.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{bahan.jenis}</p>
                    <p className="text-sm text-gray-600">{bahan.supplier_nama}</p>
                    {bahan.ketebalan && (
                      <p className="text-xs text-gray-500">Ketebalan: {bahan.ketebalan} mm</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {parseFloat(bahan.jumlah).toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-gray-500">{bahan.satuan}</p>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="badge badge-warning">{bahan.status}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(bahan.created_at).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}

            {recentBahan?.length === 0 && (
              <p className="text-center text-gray-500 py-8">Tidak ada bahan yang menunggu QC</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}