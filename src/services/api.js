import axios from 'axios';

/**
 * Pre-configured Axios instance.
 * - withCredentials: refresh-token cookie is sent/received automatically.
 * - Request interceptor: attaches the in-memory access token.
 * - Response interceptor: on 401, dedupes concurrent failures behind a single
 *   refresh call, retries the original request, and forces re-login if the
 *   refresh itself fails.
 */

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ---- Access token store (memory only — never localStorage) ----
let accessToken = null;
export const setAccessToken = (t) => { accessToken = t; };
export const clearAccessToken = () => { accessToken = null; };

// ---- Silent refresh plumbing ----
let isRefreshing = false;
let waiters = [];

const notifyWaiters = (token) => {
  waiters.forEach((cb) => cb(token));
  waiters = [];
};

async function refreshTokens() {
  const { data } = await api.post('/auth/refresh'); // sends httpOnly cookie
  const token = data?.data?.accessToken;
  if (!token) throw new Error('Refresh returned no token');
  setAccessToken(token);
  return token;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || '';

    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register');
    const alreadyRetried = original?._retried;

    if (status === 401 && !isAuthCall && !alreadyRetried) {
      original._retried = true;
      try {
        let newToken;
        if (isRefreshing) {
          // Another call is refreshing — queue this one until it resolves
          newToken = await new Promise((resolve) => waiters.push(resolve));
        } else {
          isRefreshing = true;
          newToken = await refreshTokens();
          notifyWaiters(newToken);
        }
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        notifyWaiters(null);
        clearAccessToken();
        // Redirect to login (preserve intended destination)
        if (!window.location.pathname.startsWith('/login')) {
          const redirect = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.assign(`/login?redirect=${redirect}`);
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

/** Flatten axios errors into a stable shape for the UI. */
export function normalizeError(error) {
  if (error.response?.data) {
    const d = error.response.data;
    const details = Array.isArray(d.details)
      ? d.details.map((x) => x.message).join(' · ')
      : null;
    return {
      status: error.response.status,
      message: details || d.message || 'Request failed',
    };
  }
  if (error.code === 'ECONNABORTED') {
    return { status: 0, message: 'Request timed out. Check your connection.' };
  }
  return { status: 0, message: 'Network error. Is the API running?' };
}
