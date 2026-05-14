import httpClient from '@/core/http/httpClient';
import type { User, AdminCreateUserRequest } from '../types/admin.types';

const ADMIN_USERS_API = '/admin/users';

export const adminService = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await httpClient.get<User[]>(ADMIN_USERS_API);
    return response.data;
  },

  createUser: async (data: AdminCreateUserRequest): Promise<void> => {
    const response = await httpClient.post(ADMIN_USERS_API, data);
    return response.data;
  },

  updateUserStatus: async (userId: string, enabled: boolean): Promise<void> => {
    const response = await httpClient.patch(`${ADMIN_USERS_API}/${userId}/status`, null, {
      params: { enabled }
    });
    return response.data;
  }
};
