import axios from 'axios';

// We test the real interceptors by importing the configured api instance
// and exercising it with mocked axios adapters.

describe('api service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('request interceptor', () => {
    it('injects Bearer token from localStorage', async () => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { token: 'my-token' } }),
      );

      // Re-import to get fresh module with interceptors
      vi.resetModules();
      const { api } = await import('../api');

      // Mock the adapter to capture the config
      let capturedConfig: any;
      api.defaults.adapter = async (config: any) => {
        capturedConfig = config;
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
      };

      await api.get('/test');

      expect(capturedConfig.headers.Authorization).toBe('Bearer my-token');
    });

    it('does not inject token when localStorage is empty', async () => {
      vi.resetModules();
      const { api } = await import('../api');

      let capturedConfig: any;
      api.defaults.adapter = async (config: any) => {
        capturedConfig = config;
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
      };

      await api.get('/test');

      expect(capturedConfig.headers.Authorization).toBeUndefined();
    });

    it('does not inject token when storage has no token', async () => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: {} }),
      );

      vi.resetModules();
      const { api } = await import('../api');

      let capturedConfig: any;
      api.defaults.adapter = async (config: any) => {
        capturedConfig = config;
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
      };

      await api.get('/test');

      expect(capturedConfig.headers.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor', () => {
    it('passes successful responses through', async () => {
      vi.resetModules();
      const { api } = await import('../api');

      api.defaults.adapter = async (config: any) => {
        return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
      };

      const response = await api.get('/test');
      expect(response.data).toEqual({ ok: true });
    });

    it('on 401 attempts refresh token and retries', async () => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { token: 'expired-token', refreshToken: 'refresh-123' } }),
      );

      vi.resetModules();
      const { api } = await import('../api');

      let callCount = 0;
      api.defaults.adapter = async (config: any) => {
        callCount++;
        if (callCount === 1) {
          // First call: simulate 401
          const error = new axios.AxiosError('Unauthorized', '401', config, {}, {
            status: 401,
            statusText: 'Unauthorized',
            data: {},
            headers: {},
            config,
          } as any);
          throw error;
        }
        // Retry call after refresh: succeed
        return { data: { retried: true }, status: 200, statusText: 'OK', headers: {}, config };
      };

      // Mock axios.post for the refresh token call
      const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({
        data: { accessToken: 'new-token' },
      });

      const response = await api.get('/test');

      expect(postSpy).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh-token'),
        { refreshToken: 'refresh-123' },
      );
      expect(response.data).toEqual({ retried: true });

      // Verify token was updated in storage
      const stored = JSON.parse(localStorage.getItem('auth-storage')!);
      expect(stored.state.token).toBe('new-token');
    });

    it('on refresh failure clears storage and redirects to /login', async () => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { token: 'expired', refreshToken: 'bad-refresh' } }),
      );

      // Mock window.location
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = { href: '' };

      vi.resetModules();
      const { api } = await import('../api');

      api.defaults.adapter = async (config: any) => {
        const error = new axios.AxiosError('Unauthorized', '401', config, {}, {
          status: 401,
          statusText: 'Unauthorized',
          data: {},
          headers: {},
          config,
        } as any);
        throw error;
      };

      vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh failed'));

      await expect(api.get('/test')).rejects.toThrow();

      expect(localStorage.getItem('auth-storage')).toBeNull();
      expect(window.location.href).toBe('/login');

      // Restore
      (window as any).location = originalLocation;
    });

    it('rejects non-401 errors normally', async () => {
      vi.resetModules();
      const { api } = await import('../api');

      api.defaults.adapter = async (config: any) => {
        const error = new axios.AxiosError('Server Error', '500', config, {}, {
          status: 500,
          statusText: 'Internal Server Error',
          data: { message: 'Something broke' },
          headers: {},
          config,
        } as any);
        throw error;
      };

      await expect(api.get('/test')).rejects.toThrow('Server Error');
    });

    it('does not retry when 401 has no refreshToken in storage', async () => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { token: 'expired' } }),
      );

      vi.resetModules();
      const { api } = await import('../api');

      api.defaults.adapter = async (config: any) => {
        const error = new axios.AxiosError('Unauthorized', '401', config, {}, {
          status: 401,
          statusText: 'Unauthorized',
          data: {},
          headers: {},
          config,
        } as any);
        throw error;
      };

      const postSpy = vi.spyOn(axios, 'post');

      await expect(api.get('/test')).rejects.toThrow();
      expect(postSpy).not.toHaveBeenCalled();
    });
  });
});
