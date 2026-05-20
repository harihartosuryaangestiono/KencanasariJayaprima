import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierAPI } from '../../utils/api';
import { useToast } from '../../components/Toast';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function Suppliers() {
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({ nama: '', alamat: '', kontak: '' });
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await supplierAPI.getAll();
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: supplierAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      setShowModal(false);
      resetForm();
      toast.success('Supplier berhasil ditambahkan');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Gagal menambahkan supplier');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => supplierAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      setShowModal(false);
      resetForm();
      toast.success('Supplier berhasil diupdate');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Gagal mengupdate supplier');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: supplierAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      toast.success('Supplier berhasil dihapus');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Gagal menghapus supplier');
    },
  });

  const resetForm = () => {
    setFormData({ nama: '', alamat: '', kontak: '' });
    setEditingSupplier(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      nama: supplier.nama,
      alamat: supplier.alamat || '',
      kontak: supplier.kontak || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus supplier ini?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="page-title">Suppliers</h1>
            <p className="page-subtitle">Kelola data supplier bahan baku</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn btn-primary shadow-lg"
          >
            <Plus size={20} />
            <span>Tambah Supplier</span>
          </button>
        </div>
      </div>

      <div className="card card-elevated">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Supplier</th>
                <th>Alamat</th>
                <th>Kontak</th>
                <th>Dibuat Oleh</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {suppliers?.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="font-semibold text-gray-900">{supplier.nama}</td>
                  <td className="text-gray-600">{supplier.alamat || <span className="text-gray-400">-</span>}</td>
                  <td className="text-gray-600">{supplier.kontak || <span className="text-gray-400">-</span>}</td>
                  <td>
                    <span className="badge badge-gray">{supplier.created_by_name}</span>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-200 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Nama Supplier *</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="input"
                  placeholder="Masukkan nama supplier"
                  required
                />
              </div>

              <div>
                <label className="label">Alamat</label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="input"
                  rows="3"
                  placeholder="Masukkan alamat supplier"
                />
              </div>

              <div>
                <label className="label">Kontak</label>
                <input
                  type="text"
                  value={formData.kontak}
                  onChange={(e) => setFormData({ ...formData, kontak: e.target.value })}
                  className="input"
                  placeholder="Masukkan kontak supplier"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <div className="spinner w-4 h-4"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingSupplier ? 'Update' : 'Simpan'}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}