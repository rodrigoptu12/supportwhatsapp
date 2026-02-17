import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const storage = localStorage.getItem('auth-storage');
  if (storage) {
    const { state } = JSON.parse(storage) as { state: { token?: string } };
    if (state.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
    }
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const storage = localStorage.getItem('auth-storage');
      if (storage) {
        const { state } = JSON.parse(storage) as { state: { refreshToken?: string } };

        if (state.refreshToken) {
          try {
            const response = await axios.post(`${API_URL}/auth/refresh-token`, {
              refreshToken: state.refreshToken,
            });

            const { accessToken } = response.data;

            // Update stored token
            const parsed = JSON.parse(storage) as { state: Record<string, unknown> };
            parsed.state.token = accessToken;
            localStorage.setItem('auth-storage', JSON.stringify(parsed));

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          } catch {
            localStorage.removeItem('auth-storage');
            window.location.href = '/login';
          }
        }
      }
    }

    return Promise.reject(error);
  },
);
