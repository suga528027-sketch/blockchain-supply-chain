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

  googleLogin: (idToken: string) =>
    api.post('/auth/google', { idToken }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, otp, newPassword }),

  requestDeletion: (email: string) =>
    api.post('/auth/delete-request', { email }),

  confirmDeletion: (email: string, otp: string) =>
    api.post('/auth/delete-confirm', { email, otp }),
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

  getBatchesByOwner: (ownerId: number) =>
    api.get(`/batch/owner/${ownerId}`),

  createBatch: (data: any) =>
    api.post('/batch', data),

  transferOwnership: (batchId: number, newOwnerId: number, location: string, notes: string, lat?: number, lon?: number) =>
    api.put(`/batch/${batchId}/transfer/${newOwnerId}`, null, {
      params: { location, notes, lat, lon }
    }),

  confirmDelivery: (batchId: number, retailerId: number, lat?: number, lon?: number) =>
    api.put(`/batch/${batchId}/deliver/${retailerId}`, null, {
      params: { lat, lon }
    }),

  getTrackingHistory: (batchId: number) =>
    api.get(`/batch/${batchId}/history`),

  updateBatch: (id: number, data: any) =>
    api.put(`/batch/${id}`, data),

  deleteBatch: (id: number) =>
    api.delete(`/batch/${id}`),
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

  banUser: (id: number) =>
    api.put(`/users/${id}/ban`),

  activateUser: (id: number) =>
    api.put(`/users/${id}/activate`),
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

// Notification APIs
export const notificationAPI = {
  getNotifications: (userId: number) =>
    api.get(`/notification/${userId}`),

  markAsRead: (id: number) =>
    api.put(`/notification/${id}/read`),

  markAllAsRead: (userId: number) =>
    api.put(`/notification/user/${userId}/read-all`),

  getUnreadCount: (userId: number) =>
    api.get(`/notification/${userId}/unread-count`),
};

// Product Request APIs (Marketplace)
export const productRequestAPI = {
  createRequest: (data: any) =>
    api.post('/requests', data),

  getSentRequests: (userId: number) =>
    api.get(`/requests/sent/${userId}`),

  getReceivedRequests: (userId: number) =>
    api.get(`/requests/received/${userId}`),

  getTransporterRequests: (userId: number) =>
    api.get(`/requests/transporter/${userId}`),

  getRequestById: (id: number) =>
    api.get(`/requests/${id}`),

  updateRequestStatus: (id: number, status: string) =>
    api.put(`/requests/${id}/status`, null, { params: { status } }),
};

// Analytics & Stats APIs
export const statsAPI = {
  getFarmerStats: (id: number) => api.get(`/stats/farmer/${id}`),
  getTransporterStats: (id: number) => api.get(`/stats/transporter/${id}`),
  getRetailerStats: (id: number) => api.get(`/stats/retailer/${id}`),
  getAdminStats: () => api.get('/stats/admin'),
};

// Payment APIs
export const paymentAPI = {
  createPayment: (data: any) =>
    api.post('/payment', data),

  getPaymentsByUser: (userId: number) =>
    api.get(`/payment/user/${userId}`),

  confirmPayment: (id: number) =>
    api.put(`/payment/${id}/confirm`),

  getAllPayments: () =>
    api.get('/payment'),
};

// Dispute APIs
export const disputeAPI = {
  getAllDisputes: () =>
    api.get('/dispute'),

  resolveDispute: (id: number, resolution: string) =>
    api.put(`/dispute/${id}/resolve`, { resolution }),

  createDispute: (data: any) =>
    api.post('/dispute', data),

  getDisputesByUser: (userId: number) =>
    api.get(`/dispute/user/${userId}`),
};

// Feedback APIs
export const feedbackAPI = {
  submitFeedback: (data: any) =>
    api.post('/feedback/submit', data),

  getFeedbackByConsumer: (consumerId: number) =>
    api.get(`/feedback/consumer/${consumerId}`),

  getPendingFeedback: () =>
    api.get('/feedback/pending'),

  reviewFeedback: (data: any) =>
    api.put('/feedback/review', data),
};

export default api;