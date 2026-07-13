import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Якщо тіло запиту це FormData, видаляємо заголовок Content-Type,
  // щоб браузер міг автоматично виставити його разом із межею (boundary)
  if (config.data instanceof FormData && config.headers) {
    if (typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
      config.headers.delete('content-type');
    } else {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refresh = useAuthStore.getState().refreshToken

      if (refresh) {
        try {
          const { data } = await axios.post(
            `${api.defaults.baseURL}/auth/token/refresh/`,
            { refresh }
          )
          useAuthStore.getState().setAuth(
            useAuthStore.getState().user!,
            data.access,
            refresh
          )
          originalRequest.headers.Authorization = `Bearer ${data.access}`
          return api(originalRequest)
        } catch (refreshError) {
          useAuthStore.getState().logout()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// Typed API helpers
export const authApi = {
  register: (data: { email: string; username: string; password: string; password2: string }) =>
    api.post('/auth/register/', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login/', data),

  refreshToken: (refresh: string) =>
    api.post('/auth/token/refresh/', { refresh }),

  googleLogin: (token: string) =>
    api.post('/auth/google/', { token }),

  getProfile: () =>
    api.get('/auth/profile/'),

  updateProfile: (data: FormData | Record<string, unknown>) => {
    const headers = data instanceof FormData ? {} : { 'Content-Type': 'application/json' };
    return api.patch('/auth/profile/', data, { headers });
  },

  // бекенд-ендпоінт відновлення пароля
  requestPasswordReset: (email: string) =>
    api.post('/auth/password-reset/', { email }),

  confirmPasswordReset: (data: { email: string; password: string; password2: string }) =>
    api.post('/auth/password-reset/confirm/', data),

  // Зміна паролю з профілю - POST /api/auth/password/change/
  changePassword: (data: { old_password: string; new_password: string; new_password2: string }) =>
    api.post('/auth/password/change/', data),
}