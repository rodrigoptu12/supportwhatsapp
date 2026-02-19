import { usersApi } from '../users.service';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
  },
}));

describe('usersApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getOnline gets /users/online', async () => {
    const mockUsers = [{ id: '1', fullName: 'User 1', role: 'attendant' }];
    vi.mocked(api.get).mockResolvedValue({ data: mockUsers });

    const result = await usersApi.getOnline();

    expect(api.get).toHaveBeenCalledWith('/users/online');
    expect(result).toEqual(mockUsers);
  });

  it('list gets /users with pagination', async () => {
    const mockData = { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const result = await usersApi.list(2, 25);

    expect(api.get).toHaveBeenCalledWith('/users', { params: { page: 2, limit: 25 } });
    expect(result).toEqual(mockData);
  });

  it('getById gets /users/:id', async () => {
    const mockUser = { id: '1', fullName: 'User 1' };
    vi.mocked(api.get).mockResolvedValue({ data: mockUser });

    const result = await usersApi.getById('1');

    expect(api.get).toHaveBeenCalledWith('/users/1');
    expect(result).toEqual(mockUser);
  });

  it('update patches /users/:id', async () => {
    const mockUser = { id: '1', fullName: 'Updated Name' };
    vi.mocked(api.patch).mockResolvedValue({ data: mockUser });

    const result = await usersApi.update('1', { fullName: 'Updated Name' });

    expect(api.patch).toHaveBeenCalledWith('/users/1', { fullName: 'Updated Name' });
    expect(result).toEqual(mockUser);
  });

  it('getDepartments gets /users/:id/departments', async () => {
    const mockDepts = [{ id: 'd1', name: 'Sales' }];
    vi.mocked(api.get).mockResolvedValue({ data: mockDepts });

    const result = await usersApi.getDepartments('1');

    expect(api.get).toHaveBeenCalledWith('/users/1/departments');
    expect(result).toEqual(mockDepts);
  });

  it('setDepartments puts /users/:id/departments', async () => {
    const mockDepts = [{ id: 'd1', name: 'Sales' }];
    vi.mocked(api.put).mockResolvedValue({ data: mockDepts });

    const result = await usersApi.setDepartments('1', ['d1']);

    expect(api.put).toHaveBeenCalledWith('/users/1/departments', { departmentIds: ['d1'] });
    expect(result).toEqual(mockDepts);
  });
});
