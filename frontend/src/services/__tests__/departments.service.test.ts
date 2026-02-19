import { departmentsApi } from '../departments.service';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('departmentsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list gets /departments', async () => {
    const mockDepts = [{ id: '1', name: 'Sales' }];
    vi.mocked(api.get).mockResolvedValue({ data: mockDepts });

    const result = await departmentsApi.list();

    expect(api.get).toHaveBeenCalledWith('/departments');
    expect(result).toEqual(mockDepts);
  });

  it('getById gets /departments/:id', async () => {
    const mockDept = { id: '1', name: 'Sales' };
    vi.mocked(api.get).mockResolvedValue({ data: mockDept });

    const result = await departmentsApi.getById('1');

    expect(api.get).toHaveBeenCalledWith('/departments/1');
    expect(result).toEqual(mockDept);
  });

  it('create posts to /departments', async () => {
    const mockDept = { id: '1', name: 'Support', description: 'Help desk' };
    vi.mocked(api.post).mockResolvedValue({ data: mockDept });

    const result = await departmentsApi.create({ name: 'Support', description: 'Help desk' });

    expect(api.post).toHaveBeenCalledWith('/departments', { name: 'Support', description: 'Help desk' });
    expect(result).toEqual(mockDept);
  });

  it('update patches /departments/:id', async () => {
    const mockDept = { id: '1', name: 'Updated' };
    vi.mocked(api.patch).mockResolvedValue({ data: mockDept });

    const result = await departmentsApi.update('1', { name: 'Updated' });

    expect(api.patch).toHaveBeenCalledWith('/departments/1', { name: 'Updated' });
    expect(result).toEqual(mockDept);
  });

  it('delete deletes /departments/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({});

    await departmentsApi.delete('1');

    expect(api.delete).toHaveBeenCalledWith('/departments/1');
  });
});
