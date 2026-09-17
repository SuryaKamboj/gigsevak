const API_BASE_URL =
  (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    ? 'http://localhost:5000/api'
    : ((import.meta as any).env?.VITE_API_BASE_URL || 'https://gigseva-backend.onrender.com/api');

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('gigsevak_token') || sessionStorage.getItem('gigsevak_token') || null;
  } catch {
    return null;
  }
};

let inflightTokenPromise: Promise<string | null> | null = null;

export const ensureWorkerToken = async (): Promise<string | null> => {
  const existing = getAuthToken();
  if (existing) return existing;

  if (inflightTokenPromise) {
    return inflightTokenPromise;
  }

  inflightTokenPromise = (async () => {
    try {
      const savedPhone = localStorage.getItem('user_mobile_number');
      const sessionRaw = localStorage.getItem('gharsaathi_worker_session') || sessionStorage.getItem('gharsaathi_worker_session');
      const workerUserRaw = localStorage.getItem('gigsevak_worker_user');
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
      } else if (workerUserRaw) {
        try {
          const parsed = JSON.parse(workerUserRaw);
          if (parsed.mobileNumber) {
            phone = parsed.mobileNumber.startsWith('+91') ? parsed.mobileNumber : `+91${parsed.mobileNumber.replace(/\D/g, '').slice(-10)}`;
            name = parsed.fullName || name;
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
        if (data?.data?.user) {
          localStorage.setItem('gigsevak_worker_user', JSON.stringify(data.data.user));
        }
        return freshToken;
      }
    } catch (err: any) {
      console.warn('[Worker API] ensureWorkerToken error:', err?.message || err);
    }
    return null;
  })().finally(() => {
    inflightTokenPromise = null;
  });

  return inflightTokenPromise;
};

export const request = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/verify-otp');

  let token = getAuthToken();
  if (!token && !isAuthEndpoint) {
    token = await ensureWorkerToken();
  }

  // If endpoint requires auth and no token is present, reject immediately to prevent 401 network errors
  if (!token && !isAuthEndpoint) {
    const err = new Error('No token provided.') as any;
    err.status = 401;
    err.code = 'UNAUTHENTICATED';
    throw err;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

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

    if (response.status === 401 && !(options as any)._retry && !isAuthEndpoint) {
      localStorage.removeItem('gigsevak_token');
      sessionStorage.removeItem('gigsevak_token');
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
    if (err.status !== 401) {
      console.warn(`[Worker API Error] ${options.method || 'GET'} ${endpoint}:`, err.message);
    }
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
