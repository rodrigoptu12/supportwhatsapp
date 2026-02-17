import { api } from './api';
import type { Department } from '../types';

export const departmentsApi = {
  list: async (): Promise<Department[]> => {
    const { data } = await api.get<Department[]>('/departments');
    return data;
  },

  getById: async (id: string): Promise<Department> => {
    const { data } = await api.get<Department>(`/departments/${id}`);
    return data;
  },

  create: async (body: { name: string; description?: string; order?: number }): Promise<Department> => {
    const { data } = await api.post<Department>('/departments', body);
    return data;
  },

  update: async (id: string, body: { name?: string; description?: string; isActive?: boolean; order?: number }): Promise<Department> => {
    const { data } = await api.patch<Department>(`/departments/${id}`, body);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/departments/${id}`);
  },
};
