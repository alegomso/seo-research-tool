export type UserRole = 'marketer' | 'analyst' | 'admin';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  sso_sub?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}