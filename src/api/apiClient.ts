import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5087/api';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    let token: string | null = null;
    try { token = localStorage.getItem('token'); } catch { /* Requests can still proceed without browser storage. */ }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Normalize relative URL so Axios does not drop the /api pathname from baseURL
    if (config.url && config.url.startsWith('/') && !config.url.startsWith('http')) {
      config.url = config.url.replace(/^\/+/, '');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        try { localStorage.removeItem('token'); } catch { /* Ignore unavailable browser storage. */ }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
