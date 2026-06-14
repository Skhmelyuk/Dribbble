# Детальний опис Фази 1: Налаштування та Авторизація (Фронтенд)

Цей документ містить покрокову інструкцію для розробки фронтенд-частини **Фази 1 (Налаштування та Авторизація)** на базі React, TypeScript, Tailwind CSS v4.3, Zustand, TanStack Query v5 та React Router v7.

---

## 1. Ініціалізація та структура папок

1. **Створення проєкту за допомогою Vite:**
   ```bash
   npm create vite@latest
   cd dribbble-frontend
   ```

2. **Встановлення необхідних залежностей:**
   ```bash
   npm install react-router@7.17.0 tailwindcss@4.3 @tailwindcss/vite clsx tailwind-merge axios zustand @tanstack/react-query@5
   npm install --save-dev msw@latest
   ```

3. **Створення структури директорій:**
   ```bash
   mkdir -p src/{api,components/{ui,layout},hooks,pages,store,types,utils,mocks/handlers}
   ```

4. **Файл `.env`:**
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_USE_MOCKS=true   # true для роботи з MSW, false - для роботи з реальним бекендом
   ```

---

## 2. Налаштування Tailwind CSS v4.3

З версії v4 конфігурація здійснюється безпосередньо в CSS.

1. **Додавання плагіну в `vite.config.ts`:**
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import tailwindcss from '@tailwindcss/vite'

   export default defineConfig({
     plugins: [
       react(),
       tailwindcss(),
     ],
   })
   ```

2. **Конфігурація `src/index.css`:**
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
   @import "tailwindcss";

   @theme {
     /* Колірна палітра */
     --color-primary: #EA4C89;
     --color-primary-dark: #C73872;
     --color-surface: #0F0F1A;
     --color-surface-alt: #16162a;
     --color-muted: #8E8EA0;
     --color-border: #27273F;

     /* Шрифти */
     --font-sans: 'Outfit', sans-serif;
   }

   @layer base {
     body {
       background-color: var(--color-surface);
       color: #F3F3F7;
       font-family: var(--font-sans);
       -webkit-font-smoothing: antialiased;
     }
   }
   ```

3. **Створення утиліти об'єднання класів `src/utils/cn.ts`:**
   ```typescript
   import { clsx, type ClassValue } from 'clsx'
   import { twMerge } from 'tailwind-merge'

   export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
   ```

---

## 3. Стейт-менеджмент (`src/store/authStore.ts`)

Зберігає токени доступу та інформацію про авторизованого користувача в localStorage.

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: number
  email: string
  username: string
  avatar: string | null
  bio?: string
  website?: string
  twitter?: string
  instagram?: string
  linkedin?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  updateUser: (updatedUser: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => 
        set({ user, accessToken, refreshToken }),
      updateUser: (updatedUser) => 
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null
        })),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'dribbble-auth',
    }
  )
)
```

---

## 4. Axios Клієнт (`src/api/index.ts`)

Організація клієнта з автоматичним підписом Authorization заголовку та обробкою помилок авторизації (401).

```typescript
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Додавання токену до запитів
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Перехоплення 401 та спроба оновлення токену
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refresh = useAuthStore.getState().refreshToken

      if (refresh) {
        try {
          // Запит на оновлення токену без JWT-перехоплювача
          const { data } = await axios.post(`${api.defaults.baseURL}/auth/token/refresh/`, { refresh })
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
```

---

## 5. Налаштування Mock Service Worker (MSW)

Це дозволяє фронтенду працювати незалежно від готовності бекенду.

1. **Ініціалізація service worker файлу у теці public:**
   ```bash
   npx msw init public/ --save
   ```

2. **Реалізація мокових хендлерів авторизації (`src/mocks/handlers/auth.ts`):**
   ```typescript
   import { http, HttpResponse } from 'msw'

   const BASE_URL = 'http://localhost:8000/api'

   // Локальна in-memory база даних для розробки
   let mockUser = {
     id: 1,
     email: 'designer@example.com',
     username: 'kyiv_creator',
     avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
     bio: 'UI/UX Designer & Illustrator from Kyiv',
     website: 'https://portfolio.com',
     twitter: 'https://twitter.com/kyiv_creator',
     instagram: 'https://instagram.com/kyiv_creator',
     linkedin: 'https://linkedin.com/in/kyiv_creator',
     shots_count: 0,
     followers_count: 0,
     following_count: 0
   }

   let isRegistered = false

   export const authHandlers = [
     // Реєстрація
     http.post(`${BASE_URL}/auth/register/`, async ({ request }) => {
       const body = (await request.json()) as any
       if (!body.email || !body.username || !body.password) {
         return HttpResponse.json({ detail: 'Не всі обовʼязкові поля заповнено.' }, { status: 400 })
       }
       
       isRegistered = true
       mockUser.email = body.email
       mockUser.username = body.username
       return HttpResponse.json({
         id: mockUser.id,
         email: mockUser.email,
         username: mockUser.username
       }, { status: 201 })
     }),

     // Логін
     http.post(`${BASE_URL}/auth/login/`, async ({ request }) => {
       const body = (await request.json()) as any
       if (body.email === mockUser.email || body.email === 'designer@example.com') {
         return HttpResponse.json({
           access: 'mock-access-token-jwt-12345',
           refresh: 'mock-refresh-token-jwt-67890'
         }, { status: 200 })
       }
       return HttpResponse.json({ detail: 'Невірні облікові дані.' }, { status: 401 })
     }),

     // Refresh Token
     http.post(`${BASE_URL}/auth/token/refresh/`, async () => {
       return HttpResponse.json({
         access: 'new-mock-access-token-jwt-' + Math.random().toString(36).substr(2, 9)
       }, { status: 200 })
     }),

     // Google OAuth
     http.post(`${BASE_URL}/auth/google/`, async ({ request }) => {
       const body = (await request.json()) as any
       if (!body.token) {
         return HttpResponse.json({ detail: 'Token is required' }, { status: 400 })
       }
       return HttpResponse.json({
         access: 'google-mock-access-token',
         refresh: 'google-mock-refresh-token',
         created: !isRegistered
       }, { status: 200 })
     }),

     // Отримання профілю
     http.get(`${BASE_URL}/auth/profile/`, ({ request }) => {
       const authHeader = request.headers.get('Authorization')
       if (!authHeader || !authHeader.startsWith('Bearer ')) {
         return HttpResponse.json({ detail: 'Улікові дані не надано.' }, { status: 401 })
       }
       return HttpResponse.json(mockUser, { status: 200 })
     }),

     // Оновлення профілю
     http.patch(`${BASE_URL}/auth/profile/`, async ({ request }) => {
       const authHeader = request.headers.get('Authorization')
       if (!authHeader || !authHeader.startsWith('Bearer ')) {
         return HttpResponse.json({ detail: 'Улікові дані не надано.' }, { status: 401 })
       }

       const contentType = request.headers.get('Content-Type')
       
       if (contentType?.includes('multipart/form-data')) {
         const formData = await request.formData()
         const avatarFile = formData.get('avatar') as File
         if (avatarFile) {
           mockUser.avatar = URL.createObjectURL(avatarFile)
         }
         for (const [key, value] of formData.entries()) {
           if (key !== 'avatar' && key in mockUser) {
             (mockUser as any)[key] = value
           }
         }
       } else {
         const body = (await request.json()) as any
         mockUser = { ...mockUser, ...body }
       }

       return HttpResponse.json(mockUser, { status: 200 })
     })
   ]
   ```

3. **Створення файлу конфігурації воркера (`src/mocks/browser.ts`):**
   ```typescript
   import { setupWorker } from 'msw/browser'
   import { authHandlers } from './handlers/auth'

   export const worker = setupWorker(...authHandlers)
   ```

---

## 6. Конфігурація Роутингу (React Router v7.17.0)

Реалізація роутера (`src/router.tsx`) з захистом маршрутів (Auth Guards).

```typescript
import { createBrowserRouter, redirect } from 'react-router'
import { Layout } from './components/layout/Layout'
import { useAuthStore } from './store/authStore'

// Захищає приватні маршрути
const authLoader = () => {
  const token = useAuthStore.getState().accessToken
  if (!token) throw redirect('/login')
  return null
}

// Захищає гостьові маршрути
const guestLoader = () => {
  const token = useAuthStore.getState().accessToken
  if (token) throw redirect('/profile')
  return null
}

export const router = createBrowserRouter([
  {
    path: '/',
    loader: () => redirect('/login'),
  },
  {
    path: '/login',
    loader: guestLoader,
    lazy: () => import('./pages/LoginPage').then((m) => ({ Component: m.LoginPage })),
  },
  {
    path: '/register',
    loader: guestLoader,
    lazy: () => import('./pages/RegisterPage').then((m) => ({ Component: m.RegisterPage })),
  },
  {
    Component: Layout,
    children: [
      {
        path: '/profile',
        loader: authLoader,
        lazy: () => import('./pages/ProfilePage').then((m) => ({ Component: m.ProfilePage })),
      },
    ],
  },
])
```

---

## 7. Ініціалізація Додатку та MSW (`src/main.tsx`)

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 хвилин
      gcTime: 1000 * 60 * 10,  // v5: 10 хвилин життя неактивного кешу
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
    const { worker } = await import('./mocks/browser')
    return worker.start({
      onUnhandledRequest: 'bypass',
    })
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </React.StrictMode>
  )
})
```

---

## 8. Створення базових UI компонентів

#### Кнопка (`src/components/ui/Button.tsx`):
```typescript
import { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading,
  className,
  children,
  ...props
}: ButtonProps) => {
  return (
    <button
      disabled={isLoading || props.disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-primary/20',
        variant === 'secondary' && 'border border-border text-white hover:bg-surface-alt',
        variant === 'ghost' && 'text-muted hover:text-white hover:bg-surface-alt/50',
        size === 'sm' && 'px-4 py-1.5 text-xs',
        size === 'md' && 'px-6 py-2.5 text-sm',
        size === 'lg' && 'px-8 py-3 text-base',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  )
}
```

#### Поле введення (`src/components/ui/Input.tsx`):
```typescript
import { InputHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = ({ label, error, className, ...props }: InputProps) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-medium text-muted tracking-wide">{label}</label>}
      <input
        className={cn(
          'w-full rounded-2xl bg-surface-alt border border-border px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500 mt-0.5">{error}</span>}
    </div>
  )
}
```

---

## 9. Сторінки авторизації та профілю (UI)

#### `src/pages/LoginPage.tsx`:
```typescript
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { api } from '../api'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const setAuth = useAuthStore((state) => state.setAuth)
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/login/', { email, password })
      return response.data
    },
    onSuccess: async (data) => {
      const profileResponse = await api.get('/auth/profile/', {
        headers: { Authorization: `Bearer ${data.access}` }
      })
      setAuth(profileResponse.data, data.access, data.refresh)
      navigate('/profile')
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Невірна пошта або пароль')
    }
  })

  const handleGoogleLogin = () => {
    api.post('/auth/google/', { token: 'mock-google-id-token' })
      .then(async ({ data }) => {
        const profileResponse = await api.get('/auth/profile/', {
          headers: { Authorization: `Bearer ${data.access}` }
        })
        setAuth(profileResponse.data, data.access, data.refresh)
        navigate('/profile')
      })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loginMutation.mutate()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface">
      <div className="w-full max-w-md bg-surface-alt border border-border rounded-3xl p-8 shadow-xl">
        <h2 className="text-3xl font-extrabold text-white text-center mb-2">Вхід у Dribbble</h2>
        <p className="text-sm text-muted text-center mb-8">Будь ласка, введіть ваші дані для входу</p>

        {error && <div className="p-4 mb-4 text-sm bg-red-950/30 border border-red-500/50 text-red-400 rounded-2xl">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Пароль"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" isLoading={loginMutation.isPending} className="w-full mt-2">
            Увійти
          </Button>
        </form>

        <div className="relative my-6 text-center">
          <span className="absolute inset-x-0 top-1/2 border-t border-border -z-10" />
          <span className="bg-surface-alt px-3 text-xs text-muted font-medium uppercase">або</span>
        </div>

        <Button onClick={handleGoogleLogin} variant="secondary" className="w-full justify-center">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.64l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Увійти через Google
        </Button>
      </div>
    </div>
  )
}
```

#### `src/pages/ProfilePage.tsx`:
```typescript
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export const ProfilePage = () => {
  const queryClient = useQueryClient()
  const { user, updateUser, logout } = useAuthStore()

  const [bio, setBio] = useState(user?.bio || '')
  const [website, setWebsite] = useState(user?.website || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null)
  const [successMsg, setSuccessMsg] = useState('')

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/auth/profile/')
      return data
    }
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append('bio', bio)
      formData.append('website', website)
      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      const { data } = await api.patch('/auth/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return data
    },
    onSuccess: (data) => {
      updateUser(data)
      setSuccessMsg('Профіль успішно оновлено!')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-surface-alt border border-border rounded-3xl p-8 shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-white">Мій Профіль</h1>
          <Button onClick={logout} variant="ghost" size="sm">Вийти</Button>
        </div>

        {successMsg && <div className="p-4 mb-6 text-sm bg-green-950/30 border border-green-500/50 text-green-400 rounded-2xl">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex items-center gap-6 pb-4 border-b border-border">
            <img
              src={avatarPreview || 'https://via.placeholder.com/150'}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-2 border-primary"
            />
            <div>
              <label className="block text-xs font-semibold text-muted tracking-wider uppercase mb-2">Фото профілю</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                id="avatar-upload"
              />
              <label htmlFor="avatar-upload">
                <span className="px-4 py-2 bg-surface text-sm border border-border text-white rounded-full cursor-pointer hover:bg-border transition inline-block">
                  Обрати нове зображення
                </span>
              </label>
            </div>
          </div>

          <Input
            label="Ім'я користувача"
            value={profile?.username || ''}
            disabled
            className="opacity-60"
          />

          <Input
            label="Електронна пошта"
            value={profile?.email || ''}
            disabled
            className="opacity-60"
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-medium text-muted tracking-wide">Про себе</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-2xl bg-surface bg-surface-alt border border-border px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px]"
              placeholder="Розкажіть про свої проекти..."
            />
          </div>

          <Input
            label="Сайт / Портфоліо"
            type="url"
            placeholder="https://myportfolio.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />

          <Button type="submit" isLoading={updateMutation.isPending} className="w-full mt-4">
            Зберегти зміни
          </Button>
        </form>
      </div>
    </div>
  )
}
```

---

## 10. Інтеграція з бекендом

Після того, як обидві сторони завершили свої завдання автономно:
- Команда бекенду запустила API на `http://localhost:8000`.
- Команда фронтенду розробила інтерфейс, використовуючи MSW на `http://localhost:5173`.

### 10.1. Крок до реальної інтеграції

Для перемикання фронтенду на реальний бекенд необхідно змінити значення у файлі `.env` на фронтенді:

```env
# Вимикаємо мокування
VITE_USE_MOCKS=false

# Задаємо реальну адресу API
VITE_API_BASE_URL=http://localhost:8000/api
```

Після оновлення сторінки в браузері MSW автоматично перестане перехоплювати запити, і вони підуть безпосередньо на порт `:8000`.
