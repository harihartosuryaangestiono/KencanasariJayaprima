import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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
};

// Dashboard APIs
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getProduksiRealtime: () => api.get('/dashboard/produksi-realtime'),
  getChartProduksi: (params) => api.get('/dashboard/chart/produksi', { params }),
  getChartPressdryer: () => api.get('/dashboard/chart/pressdryer'),
};

export default api;