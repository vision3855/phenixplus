import { api } from './api.js';

export const productService = {
  list(params) {
    return api.get('/products', { params }).then((r) => r.data.data);
  },
  get(id) {
    return api.get(`/products/${id}`).then((r) => r.data.data.product);
  },
  create(payload) {
    return api.post('/products', payload).then((r) => r.data.data.product);
  },
  update(id, payload) {
    return api.patch(`/products/${id}`, payload).then((r) => r.data.data.product);
  },
  archive(id) {
    return api.delete(`/products/${id}`).then((r) => r.data.data);
  },
  adjustStock(id, payload) {
    return api.patch(`/products/${id}/stock`, payload).then((r) => r.data.data.product);
  },
};
