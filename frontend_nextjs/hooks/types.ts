// API Types and Interfaces
export interface ApiConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  data?: any;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  requireAuth?: boolean;
}

export interface UseApiState<T = any> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export interface UseApiReturn<T = any> extends UseApiState<T> {
  refetch: () => Promise<void>;
  reset: () => void;
}

export interface UsePostReturn<T = any> {
  mutate: (data?: any) => Promise<ApiResponse<T>>;
  loading: boolean;
  error: ApiError | null;
  data: T | null;
  reset: () => void;
}

// Authentication API Types
export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface LoginResponse {
  data: {
    accessToken: string;
    refreshToken: string | null;
    expiresAt: string;
    user: {
      id: string;
      email: string;
      emailVerified: boolean;
      username: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      createdAt: string;
      roles: string[];
    };
  };
  meta: any | null;
}

export interface LoginErrorResponse {
  type: string;
  title: string;
  status: number;
  instance: string;
  CorrelationId: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface SignupResponse {
  data: {
    id: string;
    email: string;
    emailVerified: boolean;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    createdAt: string;
    roles: string[];
  };
  meta: any | null;
}

export interface SignupErrorResponse {
  type: string;
  title: string;
  status: number;
  instance: string;
  CorrelationId: string;
}