import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qcAPI } from '../../utils/api';
import { ClipboardCheck, CheckCircle, XCircle } from 'lucide-react';

export default function QCChecklist() {
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState(new Set());

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
      alert('Bahan berhasil di-approve');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, keterangan }) => qcAPI.reject(id, { keterangan }),
    onSuccess: () => {
      queryClient.invalidateQueries(['qc-pending']);
      alert('Bahan berhasil di-reject');
    },
  });

  const handleApprove = (id) => {
    const keterangan = prompt('Keterangan (opsional):');
    approveMutation.mutate({ id, keterangan: keterangan || '' });
  };

  const handleReject = (id) => {
    const keterangan = prompt('Alasan reject (wajib diisi):');
    if (!keterangan) {
      alert('Keterangan wajib diisi untuk reject');
      return;
    }
    rejectMutation.mutate({ id, keterangan });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">QC Checklist</h1>
        <p className="text-gray-600 mt-1">Periksa dan approve/reject bahan baku di Gudang A</p>
      </div>

      {pendingQC?.length === 0 ? (
        <div className="card text-center py-12">
          <ClipboardCheck className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-xl text-gray-600">Tidak ada bahan yang menunggu QC</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingQC?.map((bahan) => (
            <div key={bahan.id} className="card hover:shadow-lg transition-shadow">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{bahan.jenis}</h3>
                    <p className="text-sm text-gray-600">{bahan.supplier_nama}</p>
                  </div>
                  <span className="badge badge-warning">{bahan.status}</span>
                </div>

                <div className="space-y-2 mt-4">
                  {bahan.ketebalan && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ketebalan:</span>
                      <span className="font-medium">{bahan.ketebalan} mm</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Jumlah:</span>
                    <span className="font-medium">
                      {parseFloat(bahan.jumlah).toLocaleString('id-ID')} {bahan.satuan}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Lokasi:</span>
                    <span className="font-medium">{bahan.gudang_nama}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tanggal Masuk:</span>
                    <span className="font-medium">
                      {new Date(bahan.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleApprove(bahan.id)}
                  disabled={approveMutation.isPending}
                  className="btn btn-success flex-1 flex items-center justify-center"
                >
                  <CheckCircle size={18} className="mr-2" />
                  OK
                </button>
                <button
                  onClick={() => handleReject(bahan.id)}
                  disabled={rejectMutation.isPending}
                  className="btn btn-danger flex-1 flex items-center justify-center"
                >
                  <XCircle size={18} className="mr-2" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Informasi QC</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Status <strong>OK</strong>: Bahan tetap di Gudang A dan siap diproses</li>
          <li>• Status <strong>REJECT</strong>: Bahan ditandai reject dan tidak akan diproses</li>
          <li>• Hanya bahan dengan status OK yang bisa masuk ke proses Pressdryer</li>
        </ul>
      </div>
    </div>
  );
}