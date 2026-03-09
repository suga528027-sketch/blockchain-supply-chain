import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: any) =>
    api.post('/auth/register', data),

  getMe: () =>
    api.get('/auth/me'),
};

// Batch APIs
export const batchAPI = {
  getAllBatches: () =>
    api.get('/batch'),

  getBatchById: (id: number) =>
    api.get(`/batch/${id}`),

  trackBatch: (batchCode: string) =>
    api.get(`/batch/track/${batchCode}`),

  getBatchesByFarmer: (farmerId: number) =>
    api.get(`/batch/farmer/${farmerId}`),

  createBatch: (data: any) =>
    api.post('/batch', data),

  transferOwnership: (batchId: number, newOwnerId: number, location: string, notes: string) =>
    api.put(`/batch/${batchId}/transfer/${newOwnerId}`, null, {
      params: { location, notes }
    }),

  confirmDelivery: (batchId: number, retailerId: number) =>
    api.put(`/batch/${batchId}/deliver/${retailerId}`),

  getTrackingHistory: (batchId: number) =>
    api.get(`/batch/${batchId}/history`),
};

// User APIs
export const userAPI = {
  getAllUsers: () =>
    api.get('/users'),

  getUserById: (id: number) =>
    api.get(`/users/${id}`),

  updateUser: (id: number, data: any) =>
    api.put(`/users/${id}`, data),

  deleteUser: (id: number) =>
    api.delete(`/users/${id}`),
};

// Farm APIs
export const farmAPI = {
  getAllFarms: () =>
    api.get('/farm'),

  getFarmById: (id: number) =>
    api.get(`/farm/${id}`),

  getFarmsByFarmer: (farmerId: number) =>
    api.get(`/farm/farmer/${farmerId}`),

  createFarm: (data: any) =>
    api.post('/farm', data),

  updateFarm: (id: number, data: any) =>
    api.put(`/farm/${id}`, data),

  deleteFarm: (id: number) =>
    api.delete(`/farm/${id}`),
};

export default api;