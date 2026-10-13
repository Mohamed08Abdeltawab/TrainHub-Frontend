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

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401s for non-auth endpoints that haven't been retried yet
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('auth/login') &&
      !originalRequest.url?.includes('auth/refresh-token')
    ) {
      let refreshToken: string | null = null;
      let userId: string | undefined;

      try {
        refreshToken = localStorage.getItem('refreshToken');
        const rawSession = localStorage.getItem('trainhub.session');
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          userId = parsed.id;
        }
      } catch { /* ignore */ }

      if (!refreshToken || !userId) {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('trainhub.session');
        } catch { /* ignore */ }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<{ accessToken?: string; token?: string; refreshToken?: string }>(
          `${baseURL.replace(/\/+$/, '')}/auth/refresh-token`,
          { userId, refreshToken }
        );

        const newAccessToken = data.accessToken || data.token;
        const newRefreshToken = data.refreshToken;

        if (newAccessToken) {
          try {
            localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }
          } catch { /* ignore */ }

          apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh token response missing access token');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('trainhub.session');
        } catch { /* ignore */ }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
