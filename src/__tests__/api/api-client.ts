export interface ApiResponse<T = any> {
  status: number;
  headers: Headers;
  data: T;
  latencyMs: number;
  ok: boolean;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  token?: string;
  body?: any;
}

export class ApiTestClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.API_BASE_URL || 'http://127.0.0.1:4040';
  }

  async request<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const startTime = Date.now();
    let response: Response;

    try {
      response = await fetch(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } catch (error: any) {
      throw new Error(`[ApiTestClient] Error de conexión hacia ${url}: ${error.message}`);
    }

    const latencyMs = Date.now() - startTime;
    let data: any = null;
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      headers: response.headers,
      data,
      latencyMs,
      ok: response.ok,
    };
  }

  get<T = any>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, 'GET', options);
  }

  post<T = any>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, 'POST', { ...options, body });
  }

  put<T = any>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, 'PUT', { ...options, body });
  }

  delete<T = any>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, 'DELETE', options);
  }
}