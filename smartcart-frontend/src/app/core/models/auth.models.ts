export type UserRole = 'ROLE_CUSTOMER' | 'ROLE_ADMIN';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  email: string;
  roles: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserSession {
  userId: number;
  email: string;
  roles: string[];
  accessToken: string;
  refreshToken: string;
}
