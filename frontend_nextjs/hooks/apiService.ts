import { ApiConfig, ApiResponse, ApiError, RequestConfig } from './types';

// Default configuration
const DEFAULT_CONFIG: ApiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

class ApiService {
  private config: ApiConfig;
  private onAuthError?: () => void;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Set auth error callback (to clear user context)
  setAuthErrorCallback(callback: () => void) {
    this.onAuthError = callback;
  }

  // Get token from localStorage
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('userToken');
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
    const timeoutMs = timeout || this.config.timeout || 10000;
    
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

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      // Clear token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userToken');
      }
      // Call auth error callback to clear user context
      this.onAuthError?.();
    }

    throw apiError;
  }

  // Build full URL
  private buildUrl(endpoint: string): string {
    const baseURL = this.config.baseURL || '';
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseURL}${cleanEndpoint}`;
  }

  // Generic request method
  private async request<T = any>(
    method: 'GET' | 'POST',
    endpoint: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(config.headers);
    const controller = this.createAbortController(config.timeout);

    const requestInit: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (method === 'POST' && data) {
      requestInit.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, requestInit);

      if (!response.ok) {
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

  // Check if token exists
  hasToken(): boolean {
    return !!this.getToken();
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export class for custom instances
export { ApiService };