const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('gigsevak_token') || sessionStorage.getItem('gigsevak_token') || null;
  } catch {
    return null;
  }
};

export const ensureWorkerToken = async (): Promise<string | null> => {
  let token = getAuthToken();
  if (token) return token;

  try {
    const savedPhone = localStorage.getItem('user_mobile_number');
    const sessionRaw = localStorage.getItem('gharsaathi_worker_session') || sessionStorage.getItem('gharsaathi_worker_session');
    let phone = '';
    let name = 'Worker Partner';

    if (savedPhone) {
      phone = savedPhone.startsWith('+91') ? savedPhone : `+91${savedPhone.replace(/\D/g, '').slice(-10)}`;
    } else if (sessionRaw) {
      try {
        const parsed = JSON.parse(sessionRaw);
        if (parsed.phoneNumber) {
          phone = parsed.phoneNumber.startsWith('+91') ? parsed.phoneNumber : `+91${parsed.phoneNumber.replace(/\D/g, '').slice(-10)}`;
          name = parsed.name || name;
        }
      } catch {}
    }

    if (!phone) {
      return null;
    }

    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobileNumber: phone,
        role: 'WORKER',
        fullName: name
      })
    });
    const data = await res.json();
    const freshToken = data?.data?.accessToken || data?.accessToken;
    if (freshToken && typeof freshToken === 'string') {
      localStorage.setItem('gigsevak_token', freshToken);
      sessionStorage.setItem('gigsevak_token', freshToken);
      return freshToken;
    }
  } catch (err: any) {
    console.warn('[Worker API] ensureWorkerToken error:', err.message);
  }
  return null;
};

export const request = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  let token = getAuthToken();
  if (!token && !endpoint.includes('/auth/verify-otp')) {
    token = await ensureWorkerToken();
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (response.status === 401 && !(options as any)._retry && !endpoint.includes('/auth/verify-otp')) {
      const fresh = await ensureWorkerToken();
      if (fresh) {
        headers['Authorization'] = `Bearer ${fresh}`;
        return await request<T>(endpoint, { ...options, headers, _retry: true } as any);
      }
    }

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.message || `HTTP ${response.status}: Request failed`;
      const err = new Error(errorMsg) as any;
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err: any) {
    console.warn(`[Worker API Error] ${options.method || 'GET'} ${endpoint}:`, err.message);
    throw err;
  }
};

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'PUT', body }),
  delete: <T = any>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'DELETE' })
};

export default api;
