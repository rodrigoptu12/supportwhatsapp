import { api } from './api';
import type { User, PaginatedResponse, Department } from '../types';

export const usersApi = {
  list: async (page = 1, limit = 50): Promise<PaginatedResponse<User>> => {
    const { data } = await api.get<PaginatedResponse<User>>('/users', { params: { page, limit } });
    return data;
  },

  getById: async (id: string): Promise<User> => {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },

  update: async (id: string, body: { fullName?: string; avatarUrl?: string }): Promise<User> => {
    const { data } = await api.patch<User>(`/users/${id}`, body);
    return data;
  },

  getDepartments: async (userId: string): Promise<Department[]> => {
    const { data } = await api.get<Department[]>(`/users/${userId}/departments`);
    return data;
  },

  setDepartments: async (userId: string, departmentIds: string[]): Promise<Department[]> => {
    const { data } = await api.put<Department[]>(`/users/${userId}/departments`, { departmentIds });
    return data;
  },
};
