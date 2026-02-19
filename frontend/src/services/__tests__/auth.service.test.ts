import { authApi } from '../auth.service';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login posts to /auth/login and returns AuthResponse', async () => {
    const mockResponse = {
      data: {
        user: { id: '1', email: 'test@test.com', fullName: 'Test', role: 'admin' },
        accessToken: 'token-123',
        refreshToken: 'refresh-123',
      },
    };
    vi.mocked(api.post).mockResolvedValue(mockResponse);

    const result = await authApi.login('test@test.com', 'password');

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@test.com',
      password: 'password',
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('register posts to /auth/register', async () => {
    const mockUser = { id: '1', email: 'new@test.com', fullName: 'New User', role: 'attendant' };
    vi.mocked(api.post).mockResolvedValue({ data: mockUser });

    const result = await authApi.register('new@test.com', 'password', 'New User', 'attendant');

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      email: 'new@test.com',
      password: 'password',
      fullName: 'New User',
      role: 'attendant',
    });
    expect(result).toEqual(mockUser);
  });

  it('me gets /auth/me', async () => {
    const mockUser = { id: '1', email: 'test@test.com', fullName: 'Test', role: 'admin' };
    vi.mocked(api.get).mockResolvedValue({ data: mockUser });

    const result = await authApi.me();

    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(result).toEqual(mockUser);
  });

  it('logout posts to /auth/logout', async () => {
    vi.mocked(api.post).mockResolvedValue({});

    await authApi.logout();

    expect(api.post).toHaveBeenCalledWith('/auth/logout');
  });
});
