import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qcAPI } from '../../utils/api';
import { useToast } from '../../components/Toast';
import { ClipboardCheck, CheckCircle, XCircle, X } from 'lucide-react';

export default function QCChecklist() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ type: '', id: null, keterangan: '' });

  const { data: pendingQC, isLoading } = useQuery({
    queryKey: ['qc-pending'],
    queryFn: async () => {
      const response = await qcAPI.getPending();
      return response.data.data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, keterangan }) => qcAPI.approve(id, { keterangan }),
    onSuccess: () => {
      queryClient.invalidateQueries(['qc-pending']);
      toast.success('Bahan berhasil di-approve');
      setShowModal(false);
      setModalData({ type: '', id: null, keterangan: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Gagal approve bahan');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, keterangan }) => qcAPI.reject(id, { keterangan }),
    onSuccess: () => {
      queryClient.invalidateQueries(['qc-pending']);
      toast.success('Bahan berhasil di-reject');
      setShowModal(false);
      setModalData({ type: '', id: null, keterangan: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Gagal reject bahan');
    },
  });

  const handleApprove = (id) => {
    setModalData({ type: 'approve', id, keterangan: '' });
    setShowModal(true);
  };

  const handleReject = (id) => {
    setModalData({ type: 'reject', id, keterangan: '' });
    setShowModal(true);
  };

  const handleSubmitModal = () => {
    if (modalData.type === 'reject' && !modalData.keterangan.trim()) {
      toast.error('Alasan reject wajib diisi');
      return;
    }

    if (modalData.type === 'approve') {
      approveMutation.mutate({ id: modalData.id, keterangan: modalData.keterangan });
    } else {
      rejectMutation.mutate({ id: modalData.id, keterangan: modalData.keterangan });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data QC...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">QC Checklist</h1>
        <p className="page-subtitle">Periksa dan approve/reject bahan baku di Gudang A</p>
      </div>

      {pendingQC?.length === 0 ? (
        <div className="card card-elevated text-center py-16">
          <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck className="text-gray-400" size={48} />
          </div>
          <p className="text-xl font-semibold text-gray-600">Tidak ada bahan yang menunggu QC</p>
          <p className="text-sm text-gray-500 mt-2">Semua bahan telah diperiksa</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingQC?.map((bahan) => (
            <div key={bahan.id} className="card card-elevated hover:shadow-xl transition-all duration-300 border-2 border-yellow-200">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{bahan.jenis}</h3>
                    <p className="text-sm text-gray-600 font-medium">{bahan.supplier_nama}</p>
                  </div>
                  <span className="badge badge-warning">{bahan.status}</span>
                </div>

                <div className="space-y-3 mt-4 p-3 bg-gray-50 rounded-lg">
                  {bahan.ketebalan && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">Ketebalan:</span>
                      <span className="font-bold text-gray-900">{bahan.ketebalan} mm</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">Jumlah:</span>
                    <span className="font-bold text-blue-600">
                      {parseFloat(bahan.jumlah).toLocaleString('id-ID')} {bahan.satuan}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">Lokasi:</span>
                    <span className="font-semibold text-gray-900">{bahan.gudang_nama}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">Tanggal Masuk:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(bahan.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t-2 border-gray-200">
                <button
                  onClick={() => handleApprove(bahan.id)}
                  disabled={approveMutation.isPending}
                  className="btn btn-success flex-1 shadow-md"
                >
                  <CheckCircle size={18} />
                  <span>OK</span>
                </button>
                <button
                  onClick={() => handleReject(bahan.id)}
                  disabled={rejectMutation.isPending}
                  className="btn btn-danger flex-1 shadow-md"
                >
                  <XCircle size={18} />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <h3 className="font-bold text-blue-900 mb-3 flex items-center">
          <ClipboardCheck className="mr-2" size={20} />
          Informasi QC
        </h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start">
            <span className="font-bold mr-2">•</span>
            <span>Status <strong className="text-green-700">OK</strong>: Bahan tetap di Gudang A dan siap diproses</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">•</span>
            <span>Status <strong className="text-red-700">REJECT</strong>: Bahan ditandai reject dan tidak akan diproses</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">•</span>
            <span>Hanya bahan dengan status OK yang bisa masuk ke proses Pressdryer</span>
          </li>
        </ul>
      </div>

      {/* Modal untuk input keterangan */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {modalData.type === 'approve' ? 'Approve Bahan' : 'Reject Bahan'}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setModalData({ type: '', id: null, keterangan: '' });
                }} 
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">
                  {modalData.type === 'approve' ? 'Keterangan (opsional)' : 'Alasan Reject *'}
                </label>
                <textarea
                  value={modalData.keterangan}
                  onChange={(e) => setModalData({ ...modalData, keterangan: e.target.value })}
                  className="input"
                  rows="4"
                  placeholder={modalData.type === 'approve' ? 'Masukkan keterangan (opsional)' : 'Masukkan alasan reject'}
                  required={modalData.type === 'reject'}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSubmitModal}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className={`btn flex-1 ${
                    modalData.type === 'approve' ? 'btn-success' : 'btn-danger'
                  }`}
                >
                  {approveMutation.isPending || rejectMutation.isPending ? (
                    <>
                      <div className="spinner w-4 h-4"></div>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>{modalData.type === 'approve' ? 'Approve' : 'Reject'}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setModalData({ type: '', id: null, keterangan: '' });
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}