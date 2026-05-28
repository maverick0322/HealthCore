export type Role = 'PATIENT' | 'NUTRITIONIST' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: Role;
  provider: 'LOCAL' | 'AUTH0' | 'GOOGLE';
  emailVerified: boolean;
  enabled: boolean;
  createdAt: string;
}

export interface AdminCreateUserRequest {
  email: string;
  password?: string;
  role: Role;
}

export interface CatalogItem {
  barcode: string;
  name: string;
  brand: string;
  is_local: boolean;
  is_active: boolean;
  nutrition: {
    calories: number;
    proteins: number;
    carbohydrates: number;
    fats: number;
  };
}

export interface CreateLocalFoodRequest {
  name: string;
  brand?: string;
  barcode?: string;
  nutrition: CatalogItem['nutrition'];
}
