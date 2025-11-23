import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// Auth API
// ============================================================================

export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (data) =>
    api.post('/auth/register', data),

  logout: () =>
    api.post('/auth/logout'),

  getCurrentUser: () =>
    api.get('/auth/me'),
};

// ============================================================================
// Leads API
// ============================================================================

export const leadsAPI = {
  // Get all leads
  getLeads: (params = {}) =>
    api.get('/leads', { params }),

  // Get single lead
  getLead: (id) =>
    api.get(`/leads/${id}`),

  // Create lead
  createLead: (lead) =>
    api.post('/leads', lead),

  // Bulk create leads
  createBulkLeads: (leads) =>
    api.post('/leads/bulk', { leads }),

  // Update lead
  updateLead: (id, updates) =>
    api.patch(`/leads/${id}`, updates),

  // Delete lead
  deleteLead: (id) =>
    api.delete(`/leads/${id}`),

  // Get stats
  getStats: () =>
    api.get('/leads/stats/summary'),
};

// ============================================================================
// Verification API
// ============================================================================

export const verificationAPI = {
  // Verify single email
  verifyEmail: (email) =>
    api.post('/verify/email', { email }),

  // Bulk verify
  verifyBulk: (emails) =>
    api.post('/verify/bulk', { emails }),

  // Get verification status
  getVerificationStatus: (id) =>
    api.get(`/verify/${id}`),
};

// ============================================================================
// Enrichment API
// ============================================================================

export const enrichmentAPI = {
  // Enrich lead
  enrichLead: (leadId) =>
    api.post(`/enrich/lead/${leadId}`),

  // Enrich company
  enrichCompany: (domain) =>
    api.post('/enrich/company', { domain }),
};

// ============================================================================
// Analytics API
// ============================================================================

export const analyticsAPI = {
  // Get dashboard stats
  getDashboardStats: () =>
    api.get('/analytics/dashboard'),

  // Get lead growth
  getLeadGrowth: (period = '30d') =>
    api.get('/analytics/growth', { params: { period } }),

  // Get quality distribution
  getQualityDistribution: () =>
    api.get('/analytics/quality'),
};

// ============================================================================
// Export API
// ============================================================================

export const exportAPI = {
  // Create export
  createExport: (format, filters = {}) =>
    api.post('/export', { format, filters }),

  // Get export status
  getExportStatus: (id) =>
    api.get(`/export/${id}`),

  // List exports
  listExports: () =>
    api.get('/export'),

  // Download export
  downloadExport: (id) =>
    api.get(`/export/${id}/download`, { responseType: 'blob' }),
};

export default api;
