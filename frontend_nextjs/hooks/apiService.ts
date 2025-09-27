import { ApiConfig, ApiResponse, ApiError, RequestConfig, RefreshTokenResponse } from './types';

// Default configuration
// Use NEXT_PUBLIC_API_URL when provided, otherwise fall back to a safe local default.
// This prevents the frontend from silently calling an unexpected production URL
// when environment variables were not set at build/runtime.
const DEFAULT_CONFIG: ApiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
};

class ApiService {
  private config: ApiConfig;
  private onAuthError?: () => void;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Log the baseURL at runtime in the browser console for easier debugging
    if (typeof window !== 'undefined') {
      console.info('ApiService configured baseURL:', this.config.baseURL);
    }
  }

  // Set auth error callback (to clear user context)
  setAuthErrorCallback(callback: () => void) {
    this.onAuthError = () => {
      console.log('🚨 onAuthError called - clearing user context');
      callback();
    };
  }

  // Get token from localStorage
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('userToken');
  }

  // Get refresh token from localStorage (fallback for development when cookies don't work)
  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  // Build headers with auth token
  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers = { ...this.config.headers, ...customHeaders };
    
    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // Create AbortController for timeout
  private createAbortController(timeout?: number): AbortController {
    const controller = new AbortController();
    const timeoutMs = timeout || this.config.timeout || 50000;
    
    setTimeout(() => controller.abort(), timeoutMs);
    return controller;
  }

  // Handle API errors
  private async handleError(response: Response): Promise<never> {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const apiError: ApiError = {
      message: errorData.message || `HTTP ${response.status}`,
      status: response.status,
      statusText: response.statusText,
      data: errorData,
    };

    throw apiError;
  }

  // Build full URL
  private buildUrl(endpoint: string): string {
    const baseURL = this.config.baseURL || '';
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseURL}${cleanEndpoint}`;
  }

  // Refresh access token
  private async refreshAccessToken(): Promise<string | null> {
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const newAccessToken = await this.refreshPromise;
      return newAccessToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  // Perform the actual token refresh API call
  private async performTokenRefresh(): Promise<string | null> {
    const url = this.buildUrl('/auth/refresh');
    
    console.log('🔄 Attempting token refresh to:', url);
    console.log('🍪 Document cookies:', document.cookie);
    
    // Check if refresh token cookie exists (it might be HTTP-only)
    const hasRefreshTokenCookie = document.cookie.includes('refreshToken=');
    console.log('🍪 Refresh token cookie visible:', hasRefreshTokenCookie);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
        // No body or extra headers needed - refresh token is in HTTP-only cookie
      });

      console.log('🔄 Refresh response status:', response.status);
      console.log('🔄 Refresh response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if new cookies were set
      const setCookieHeader = response.headers.get('set-cookie');
      console.log('🍪 Set-Cookie header:', setCookieHeader);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Refresh failed with:', errorText);
        throw new Error('Token refresh failed');
      }

      const data: RefreshTokenResponse = await response.json();
      console.log('✅ Refresh successful');
      
      // Store new access token only (refresh token is in HTTP-only cookie)
      if (typeof window !== 'undefined') {
        localStorage.setItem('userToken', data.data.accessToken);
        
        // Update user expiry time in localStorage if user exists
        const existingUser = localStorage.getItem('frencircle_user');
        if (existingUser) {
          try {
            const userData = JSON.parse(existingUser);
            userData.expiry = data.data.expiresAt;
            localStorage.setItem('frencircle_user', JSON.stringify(userData));
            console.log('✅ Updated user expiry time');
          } catch (error) {
            console.error('Error updating user expiry:', error);
          }
        }
      }

      return data.data.accessToken;
    } catch (error) {
      console.log('❌ Token refresh error:', error);
      // Clear access token on refresh failure (refresh token cookie will be handled by server)
      this.clearToken();
      this.onAuthError?.();
      return null;
    }
  }

  // Generic request method
  private async request<T = any>(
    method: 'GET' | 'POST',
    endpoint: string,
    data?: any,
    config: RequestConfig = {},
    isRetry: boolean = false
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(config.headers);
    const controller = this.createAbortController(config.timeout);

    const requestInit: RequestInit = {
      method,
      headers,
      signal: controller.signal,
      credentials: 'include', // Include cookies in all requests
    };

    if (method === 'POST' && data) {
      requestInit.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, requestInit);

      if (!response.ok) {
        // Handle 401 Unauthorized with token refresh
        if (response.status === 401 && !isRetry && endpoint !== '/auth/refresh') {
          try {
            const newAccessToken = await this.refreshAccessToken();
            
            if (newAccessToken) {
              // Retry the original request with new token
              console.log('✅ Token refresh successful, retrying original request');
              return this.request<T>(method, endpoint, data, config, true);
            } else {
              // Refresh returned null - refresh failed, clear user context
              console.log('❌ Token refresh returned null, clearing user context');
              this.clearToken();
              this.onAuthError?.();
            }
          } catch (refreshError) {
            // Token refresh threw an error, clear user context
            console.log('❌ Token refresh threw error:', refreshError);
            this.clearToken();
            this.onAuthError?.();
          }
        }

        await this.handleError(response);
      }

      const responseData = await response.json();
      
      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw {
          message: 'Request timeout',
          status: 408,
          statusText: 'Request Timeout',
        } as ApiError;
      }
      throw error;
    }
  }

  // GET method
  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  // POST method
  async post<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, config);
  }

  // Set token in localStorage
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userToken', token);
    }
  }

  // Remove token from localStorage
  clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userToken');
    }
  }

  // Set refresh token in localStorage
  setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', token);
    }
  }

  // Remove refresh token from localStorage
  clearRefreshToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('refreshToken');
    }
  }

  // Set both tokens at once
  setTokens(accessToken: string, refreshToken: string): void {
    this.setToken(accessToken);
    this.setRefreshToken(refreshToken);
  }

  // Clear both tokens
  clearAllTokens(): void {
    this.clearToken();
    this.clearRefreshToken();
  }

  // Check if token exists
  hasToken(): boolean {
    return !!this.getToken();
  }

  // Check if refresh token exists
  hasRefreshToken(): boolean {
    return !!this.getRefreshToken();
  }

  // Debug method to check tokens 
  getTokensDebug(): { accessToken: string | null; refreshToken: string | null } {
    return {
      accessToken: this.getToken(),
      refreshToken: this.getRefreshToken()
    };
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export class for custom instances
export { ApiService };