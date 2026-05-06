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
