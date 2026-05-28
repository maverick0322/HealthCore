import httpClient from '@/core/http/httpClient';
import type { User, AdminCreateUserRequest, CatalogItem, CreateLocalFoodRequest } from '../types/admin.types';

const ADMIN_USERS_API = '/admin/users';
const CATALOG_LOCAL_API = '/catalog/local';

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
  },

  createLocalFood: async (data: CreateLocalFoodRequest): Promise<CatalogItem> => {
    const response = await httpClient.post<CatalogItem>(CATALOG_LOCAL_API, data);
    return response.data;
  },

  updateLocalFood: async (barcode: string, data: Partial<CreateLocalFoodRequest>): Promise<CatalogItem> => {
    const response = await httpClient.put<CatalogItem>(`${CATALOG_LOCAL_API}/${encodeURIComponent(barcode)}`, data);
    return response.data;
  },

  deactivateLocalFood: async (barcode: string): Promise<void> => {
    await httpClient.delete(`${CATALOG_LOCAL_API}/${encodeURIComponent(barcode)}`);
  }
};
