export type UserRole =
  | 'PLATFORM_ADMIN'
  | 'ORGANIZATION_OWNER'
  | 'ORGANIZATION_ADMIN'
  | 'BRANCH_MANAGER'
  | 'EMPLOYEE'
  | 'CUSTOMER';

export interface UserProfile {
  phone?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  profile?: UserProfile;
}

export interface AuthTokens {
  access: string;
}

export interface LoginResponse {
  access: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirm_password: string;
  first_name?: string;
  last_name?: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface UserUpdateRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[] | string> | string | null;
  };
}
