import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

export const useLeadsStore = create((set) => ({
  leads: [],
  total: 0,
  page: 1,
  limit: 50,
  isLoading: false,
  stats: null,

  setLeads: (leads, total) => set({ leads, total }),
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit }),
  setLoading: (isLoading) => set({ isLoading }),
  setStats: (stats) => set({ stats }),

  addLead: (lead) => set((state) => ({
    leads: [lead, ...state.leads],
    total: state.total + 1,
  })),

  updateLead: (id, updates) => set((state) => ({
    leads: state.leads.map((lead) =>
      lead.id === id ? { ...lead, ...updates } : lead
    ),
  })),

  removeLead: (id) => set((state) => ({
    leads: state.leads.filter((lead) => lead.id !== id),
    total: state.total - 1,
  })),
}));
