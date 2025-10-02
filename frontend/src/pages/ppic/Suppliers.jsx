import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierAPI } from '../../utils/api';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function Suppliers() {
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({ nama: '', alamat: '', kontak: '' });
  const queryClient = useQueryClient();

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
      alert('Supplier berhasil ditambahkan');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => supplierAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      setShowModal(false);
      resetForm();
      alert('Supplier berhasil diupdate');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: supplierAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      alert('Supplier berhasil dihapus');
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
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-1">Kelola data supplier bahan baku</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Tambah Supplier
        </button>
      </div>

      <div className="card">
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
                  <td className="font-medium">{supplier.nama}</td>
                  <td>{supplier.alamat || '-'}</td>
                  <td>{supplier.kontak || '-'}</td>
                  <td>{supplier.created_by_name}</td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nama Supplier *</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="input"
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
                />
              </div>

              <div>
                <label className="label">Kontak</label>
                <input
                  type="text"
                  value={formData.kontak}
                  onChange={(e) => setFormData({ ...formData, kontak: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingSupplier ? 'Update' : 'Simpan'}
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
    </div>
  );
}