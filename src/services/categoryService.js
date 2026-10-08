import { api } from './api.js';

export const categoryService = {
  list() {
    return api.get('/categories').then((r) => r.data.data.categories);
  },
  create(payload) {
    return api.post('/categories', payload).then((r) => r.data.data.category);
  },
};
