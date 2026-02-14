import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface IRequestConfig extends AxiosRequestConfig {
  skipErrorHandling?: boolean;
}

let apiInstance: AxiosInstance | null = null;
let csrfToken: string | null = null;
let getAuthToken: (() => Promise<string | null>) | null = null;
let refreshTokenFn: (() => Promise<boolean>) | null = null;
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string | null) => void; reject: (error: any) => void }> =
  [];

export const setAuthTokenGetter = (getter: () => Promise<string | null>) => {
  getAuthToken = getter;
};

export const setRefreshTokenFn = (fn: () => Promise<boolean>) => {
  refreshTokenFn = fn;
};

export const initializeApi = (baseURL: string) => {
  const axiosParams = {
    baseURL: `${baseURL}api/`,
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    },
  };

  apiInstance = axios.create(axiosParams);

  apiInstance.interceptors.request.use(
    async config => {
      if (getAuthToken) {
        try {
          const token = await getAuthToken();
          if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (_error) {
          // Silent fail
        }
      }

      if (
        csrfToken &&
        ['post', 'patch', 'put', 'delete'].includes(config.method?.toLowerCase() || '')
      ) {
        config.headers['X-CSRF-Header'] = csrfToken;
      }
      return config;
    },
    error => Promise.reject(error)
  );

  apiInstance.interceptors.response.use(
    response => response,
    async (error: any) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              if (token) {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
              }
              return apiInstance!.request(originalRequest);
            })
            .catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          if (!refreshTokenFn) {
            isRefreshing = false;
            return Promise.reject(error);
          }

          const refreshSuccess = await refreshTokenFn();

          if (refreshSuccess && getAuthToken) {
            const newToken = await getAuthToken();

            failedQueue.forEach(({ resolve }) => resolve(newToken));
            failedQueue = [];

            if (newToken) {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            }

            isRefreshing = false;
            return apiInstance!.request(originalRequest);
          } else {
            failedQueue.forEach(({ reject }) => reject(error));
            failedQueue = [];
            isRefreshing = false;
            return Promise.reject(error);
          }
        } catch (refreshError) {
          failedQueue.forEach(({ reject }) => reject(refreshError));
          failedQueue = [];
          isRefreshing = false;
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return apiInstance;
};

export const getApiInstance = (): AxiosInstance => {
  if (!apiInstance) {
    throw new Error('API not initialized. Call initializeApi first.');
  }
  return apiInstance;
};

const api = {
  get: <T>(url: string, config?: IRequestConfig) => getApiInstance().get<T>(url, config),
  post: <T>(url: string, body: unknown, config?: IRequestConfig) =>
    getApiInstance().post<T>(url, body, config),
  patch: <T>(url: string, body: unknown, config?: IRequestConfig) =>
    getApiInstance().patch<T>(url, body, config),
  put: <T>(url: string, body: unknown, config?: IRequestConfig) =>
    getApiInstance().put<T>(url, body, config),
  delete: <T>(url: string, config?: IRequestConfig) => getApiInstance().delete<T>(url, config),
};

export default api;
