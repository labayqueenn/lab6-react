import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_URL + '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const authStorage = {
  get() {
    try {
      return JSON.parse(localStorage.getItem('auth')) || null;
    } catch {
      return null;
    }
  },
  set(value) {
    localStorage.setItem('auth', JSON.stringify(value));
  },
  clear() {
    localStorage.removeItem('auth');
  },
};

// Attach the access token to every request
api.interceptors.request.use((config) => {
  const auth = authStorage.get();
  if (auth && auth.access_token) {
    config.headers.Authorization = 'Bearer ' + auth.access_token;
  }
  return config;
});

// One refresh at a time, shared by every request that fails with 401
let refreshing = null;

function refreshAccessToken() {
  const auth = authStorage.get();
  if (!auth || !auth.refresh_token) {
    return Promise.reject(new Error('No refresh token'));
  }
  if (!refreshing) {
    refreshing = axios
      .post(API_URL + '/api/auth/refresh', { refresh_token: auth.refresh_token })
      .then((res) => {
        const tokens = res.data.tokens;
        authStorage.set({
          ...auth,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || auth.refresh_token,
        });
        return tokens.access_token;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

// If the access token expired: refresh once, then retry the request.
// If that fails, clear the session and tell the app to show the login page.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response && error.response.status;
    const isAuthCall = original && original.url && /(^|\/)auth\//.test(original.url);

    if (status === 401 && original && !isAuthCall) {
      if (!original._retried) {
        original._retried = true;
        try {
          const token = await refreshAccessToken();
          original.headers.Authorization = 'Bearer ' + token;
          return api(original);
        } catch (e) {
          // fall through to logout
        }
      }
      authStorage.clear();
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

// Readable error text for forms: the API sends { "error": "...", "status": 422 }
export function getErrorMessage(error) {
  if (error.response && error.response.data && error.response.data.error) {
    return error.response.data.error;
  }
  if (error.message === 'Network Error') {
    return 'Cannot reach the server. If it was idle, wait a minute and try again.';
  }
  return error.message || 'Something went wrong.';
}

export default api;