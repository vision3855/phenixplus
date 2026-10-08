import { api, setAccessToken, clearAccessToken } from './api.js';

export const authService = {
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.data.accessToken);
    return data.data; // { user, accessToken }
  },

  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
    }
  },

  async logoutAll() {
    try {
      await api.post('/auth/logout-all');
    } finally {
      clearAccessToken();
    }
  },
};
