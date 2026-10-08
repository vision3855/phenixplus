import { api } from './api.js';

export const analyticsService = {
  dashboard(params) {
    return api.get('/analytics/dashboard', { params }).then((r) => r.data.data);
  },
  lowStock() {
    return api.get('/analytics/low-stock').then((r) => r.data.data);
  },
};
