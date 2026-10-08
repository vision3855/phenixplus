import { api } from './api.js';

export const saleService = {
  create(payload) {
    return api.post('/sales', payload).then((r) => r.data.data.sale);
  },
  list(params) {
    return api.get('/sales', { params }).then((r) => r.data.data);
  },
  get(id) {
    return api.get(`/sales/${id}`).then((r) => r.data.data.sale);
  },
};
