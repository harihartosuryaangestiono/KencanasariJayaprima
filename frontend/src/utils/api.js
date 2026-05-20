import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor untuk menambahkan token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor untuk handle errors
api.interceptors.response.use(
  (response) => {
    // For blob responses, return as-is
    if (response.config.responseType === 'blob') {
      return response;
    }
    return response;
  },
  (error) => {
    // Handle blob error responses - try to parse JSON error from blob
    if (error.config?.responseType === 'blob' && error.response) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            reject({
              ...error,
              response: {
                ...error.response,
                data: errorData
              }
            });
          } catch (e) {
            // If not JSON, it might be actual blob data
            reject(error);
          }
        };
        reader.onerror = () => reject(error);
        reader.readAsText(error.response.data);
      });
    }

    // Handle network errors (empty response, connection refused, etc.)
    if (!error.response) {
      console.error('Network error:', error.message);

      // Check if it's an empty response error
      if (error.code === 'ERR_EMPTY_RESPONSE' || error.message.includes('ERR_EMPTY_RESPONSE')) {
        console.error('Empty response error - Backend server may not be running');
        return Promise.reject({
          ...error,
          message: 'Server tidak merespons. Pastikan backend server sedang berjalan.',
          isNetworkError: true
        });
      }

      // Handle other network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        return Promise.reject({
          ...error,
          message: 'Tidak dapat terhubung ke server. Pastikan backend server sedang berjalan di http://localhost:5000',
          isNetworkError: true
        });
      }

      return Promise.reject({
        ...error,
        message: 'Terjadi kesalahan koneksi. Silakan coba lagi.',
        isNetworkError: true
      });
    }

    // Handle HTTP errors
    if (error.response?.status === 401) {
      // Don't clear token or redirect here
      // Let AuthContext handle authentication state
      // This prevents premature logout during checkAuth on page refresh
      // Components can handle 401 errors as needed
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  me: () => api.get('/auth/me'),
  register: (data) => api.post('/auth/register', data),
};

// Supplier APIs
export const supplierAPI = {
  getAll: () => api.get('/suppliers'),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

// Bahan APIs
export const bahanAPI = {
  getAll: (params) => api.get('/bahan', { params }),
  getById: (id) => api.get(`/bahan/${id}`),
  create: (data) => api.post('/bahan', data),
  getStokSummary: () => api.get('/bahan/stok/summary'),
};

// QC APIs
export const qcAPI = {
  getPending: () => api.get('/qc/pending'),
  approve: (id, data) => api.put(`/qc/${id}/approve`, data),
  reject: (id, data) => api.put(`/qc/${id}/reject`, data),
  batch: (data) => api.put('/qc/batch', data),
};

// Pressdryer APIs
export const pressdryerAPI = {
  getMesin: () => api.get('/pressdryer/mesin'),
  getCoreAvailable: () => api.get('/pressdryer/core-available'),
  process: (data) => api.post('/pressdryer/process', data),
  getLogs: (params) => api.get('/pressdryer/logs', { params }),
};

// Produksi APIs
export const produksiAPI = {
  repair: (data) => api.post('/produksi/repair', data),
  coreBuilder: (data) => api.post('/produksi/core-builder', data),
  scraffJoin: (data) => api.post('/produksi/scraff-join', data),
  settingPlywood: (data) => api.post('/produksi/setting-plywood', data),
  hotpress: (data) => api.post('/produksi/hotpress', data),
  getGudangB: () => api.get('/produksi/gudang-b'),
  getGudangC: () => api.get('/produksi/gudang-c'),
  getSettingPlywoodList: () => api.get('/produksi/setting-plywood-list'),
};

// Laporan APIs
export const laporanAPI = {
  faceback: (params) => api.get('/laporan/faceback', { params }),
  pressdryer: (params) => api.get('/laporan/pressdryer', { params }),
  penggunaanLem: (params) => api.get('/laporan/penggunaan-lem', { params }),
  stokGudang: () => api.get('/laporan/stok-gudang'),
  finishedGoods: (params) => api.get('/laporan/finished-goods', { params }),
  exportPressdryer: (params) => {
    return api.get('/laporan/export/pressdryer', {
      params,
      responseType: 'blob'
    });
  },
  exportFaceback: (params) => {
    return api.get('/laporan/export/faceback', {
      params,
      responseType: 'blob'
    });
  },
};

// Dashboard APIs
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getProduksiRealtime: () => api.get('/dashboard/produksi-realtime'),
  getChartProduksi: (params) => api.get('/dashboard/chart/produksi', { params }),
  getChartPressdryer: () => api.get('/dashboard/chart/pressdryer'),
};

export default api;