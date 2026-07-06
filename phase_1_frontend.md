# Фаза 1: Налаштування та Авторизація (Фронтенд) — [СКОРИГОВАНА]

> Скориговано на основі аналізу дизайну Figma (design_analysis.md).
> Назва проекту в дизайні: **Dribbble** clone.
> Стек: React + TypeScript + Tailwind CSS v4 + Zustand + TanStack Query v5 + React Router v7 + MSW.

---

## 1. Ініціалізація та залежності

```bash
npm create vite@latest dribbble-frontend -- --template react-ts
cd dribbble-frontend
npm install react-router@7 tailwindcss@4 @tailwindcss/vite clsx tailwind-merge \
    axios zustand @tanstack/react-query lucide-react
npm install --save-dev msw@latest
npx msw init public/ --save
```

**.env:**
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_USE_MOCKS=true
```

---

## 2. Структура директорій

```
src/
├── api/
│   └── index.ts          # axios instance + interceptors
├── components/
│   ├── layout/
│   │   └── Layout.tsx    # Wrapper з <Navbar /> + <Outlet />
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Logo.tsx       # Лого "Voxel" (svg + text)
│       └── Avatar.tsx     # Аватар з fallback
├── hooks/
│   └── useAuth.ts
├── mocks/
│   ├── browser.ts
│   └── handlers/
│       └── auth.ts
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ForgotPasswordPage.tsx      # НОВА — з дизайну
│   │   └── ForgotPasswordConfirmPage.tsx # НОВА — з дизайну
│   ├── ProfilePage.tsx   # Перенесено у Фазу 2 (публічний профіль)
│   ├── SettingsPage.tsx  # НОВА — налаштування акаунту
│   └── NotFoundPage.tsx
├── store/
│   └── authStore.ts
├── types/
│   └── user.ts
└── utils/
    └── cn.ts
```

---

## 3. Типи (`src/types/user.ts`)

```typescript
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
  shots_count?: number
  followers_count?: number
  following_count?: number
}

// Публічний профіль (без email)
export interface PublicUser {
  id: number
  username: string
  avatar: string | null
  bio: string
  website: string
  twitter: string
  instagram: string
  linkedin: string
  shots_count: number
  followers_count: number
  following_count: number
  is_following: boolean
}
```

---

## 4. Auth Store (`src/store/authStore.ts`)

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '../types/user'

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
    { name: 'dribbble-auth' }
  )
)
```

---

## 5. Axios Клієнт (`src/api/index.ts`)

```typescript
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refresh = useAuthStore.getState().refreshToken
      if (refresh) {
        try {
          const { data } = await axios.post(`${api.defaults.baseURL}/auth/token/refresh/`, { refresh })
          useAuthStore.getState().setAuth(useAuthStore.getState().user!, data.access, refresh)
          originalRequest.headers.Authorization = `Bearer ${data.access}`
          return api(originalRequest)
        } catch {
          useAuthStore.getState().logout()
          window.location.href = '/login'
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

## 6. Роутинг (`src/router.tsx`)

```typescript
import { createBrowserRouter, Navigate, Outlet, redirect } from 'react-router'
import { Layout } from './components/layout/Layout'
import { useAuthStore } from './store/authStore'

const ProtectedRoute = () => {
  const token = useAuthStore((s) => s.accessToken)
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

const GuestRoute = () => {
  const token = useAuthStore((s) => s.accessToken)
  return token ? <Navigate to="/feed" replace /> : <Outlet />
}

export const router = createBrowserRouter([
  {
    path: '/',
    loader: () => {
      const token = useAuthStore.getState().accessToken
      throw redirect(token ? '/feed' : '/login')
    },
  },

  // ─── Auth (Guest only) ────────────────────────────────────
  {
    Component: GuestRoute,
    children: [
      {
        path: '/login',
        lazy: () => import('./pages/auth/LoginPage').then((m) => ({ Component: m.LoginPage })),
      },
      {
        path: '/register',
        lazy: () => import('./pages/auth/RegisterPage').then((m) => ({ Component: m.RegisterPage })),
      },
      {
        path: '/forgot-password',
        lazy: () => import('./pages/auth/ForgotPasswordPage').then((m) => ({ Component: m.ForgotPasswordPage })),
      },
      {
        path: '/forgot-password/confirm',
        lazy: () => import('./pages/auth/ForgotPasswordConfirmPage').then((m) => ({ Component: m.ForgotPasswordConfirmPage })),
      },
    ],
  },

  // ─── Protected (Auth required) ────────────────────────────
  {
    Component: ProtectedRoute,
    children: [
      {
        Component: Layout,
        children: [
          {
            path: '/settings',
            lazy: () => import('./pages/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
          },
          // Фаза 2+ сторінки (будуть додані пізніше)
          // /feed, /upload, /shot/:id, /profile/:username
        ],
      },
    ],
  },

  { path: '*', lazy: () => import('./pages/NotFoundPage').then((m) => ({ Component: m.NotFoundPage })) },
])
```

---

## 7. MSW Mock Handlers (`src/mocks/handlers/auth.ts`)

```typescript
import { http, HttpResponse } from 'msw'

const BASE_URL = 'http://localhost:8000/api'

let mockUser = {
  id: 1,
  email: 'designer@example.com',
  username: 'kyiv_creator',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
  bio: 'UI/UX Designer from Kyiv',
  website: 'https://portfolio.com',
  twitter: '',
  instagram: '',
  linkedin: '',
  shots_count: 0,
  followers_count: 0,
  following_count: 0
}

export const authHandlers = [
  // Реєстрація
  http.post(`${BASE_URL}/auth/register/`, async ({ request }) => {
    const body = (await request.json()) as any
    if (!body.email || !body.username || !body.password) {
      return HttpResponse.json({ detail: 'Не всі обов\'язкові поля заповнено.' }, { status: 400 })
    }
    mockUser.email = body.email
    mockUser.username = body.username
    return HttpResponse.json({ id: mockUser.id, email: mockUser.email, username: mockUser.username }, { status: 201 })
  }),

  // Логін
  http.post(`${BASE_URL}/auth/login/`, async ({ request }) => {
    const body = (await request.json()) as any
    if (body.email === mockUser.email || body.email === 'designer@example.com') {
      return HttpResponse.json({ access: 'mock-access-token', refresh: 'mock-refresh-token' }, { status: 200 })
    }
    return HttpResponse.json({ detail: 'Невірні облікові дані.' }, { status: 401 })
  }),

  // Refresh Token
  http.post(`${BASE_URL}/auth/token/refresh/`, async () => {
    return HttpResponse.json({ access: 'new-mock-access-token-' + Date.now() }, { status: 200 })
  }),

  // Google OAuth
  http.post(`${BASE_URL}/auth/google/`, async () => {
    return HttpResponse.json({ access: 'google-mock-token', refresh: 'google-mock-refresh', created: false }, { status: 200 })
  }),

  // Свій профіль — GET
  http.get(`${BASE_URL}/auth/profile/`, ({ request }) => {
    if (!request.headers.get('Authorization')?.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Не авторизовано.' }, { status: 401 })
    }
    return HttpResponse.json(mockUser, { status: 200 })
  }),

  // Свій профіль — PATCH
  http.patch(`${BASE_URL}/auth/profile/`, async ({ request }) => {
    if (!request.headers.get('Authorization')?.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Не авторизовано.' }, { status: 401 })
    }
    const contentType = request.headers.get('Content-Type')
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData()
      const avatarFile = formData.get('avatar') as File
      if (avatarFile) mockUser.avatar = URL.createObjectURL(avatarFile)
      for (const [key, value] of formData.entries()) {
        if (key !== 'avatar' && key in mockUser) (mockUser as any)[key] = value
      }
    } else {
      const body = (await request.json()) as any
      mockUser = { ...mockUser, ...body }
    }
    return HttpResponse.json(mockUser, { status: 200 })
  }),

  // Публічний профіль — GET /api/users/:username/
  http.get(`${BASE_URL}/users/:username/`, ({ params }) => {
    if (params.username === mockUser.username) {
      const { email, ...publicUser } = mockUser
      return HttpResponse.json({ ...publicUser, is_following: false }, { status: 200 })
    }
    return HttpResponse.json({ detail: 'Користувача не знайдено.' }, { status: 404 })
  }),

  // Зміна паролю
  http.post(`${BASE_URL}/auth/password/change/`, async ({ request }) => {
    if (!request.headers.get('Authorization')?.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Не авторизовано.' }, { status: 401 })
    }
    return HttpResponse.json({ detail: 'Пароль успішно змінено.' }, { status: 200 })
  }),

  // Password Reset (email)
  http.post(`${BASE_URL}/auth/password/reset/`, async () => {
    return HttpResponse.json({ detail: 'Інструкції надіслано на email.' }, { status: 200 })
  }),

  // Password Reset Confirm
  http.post(`${BASE_URL}/auth/password/reset/confirm/`, async () => {
    return HttpResponse.json({ detail: 'Пароль успішно скинуто.' }, { status: 200 })
  }),
]
```

---

## 8. Компоненти UI

### `src/components/ui/Logo.tsx`
```typescript
// Компонент Лого "Dribbble" — відповідає дизайну Figma
// Використовує іконку баскетбольного м'яча та рукописний шрифт

export const Logo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeMap = {
    sm: { iconSize: 'w-5 h-5', textSize: 'text-lg' },
    md: { iconSize: 'w-7 h-7', textSize: 'text-2xl' },
    lg: { iconSize: 'w-10 h-10', textSize: 'text-4xl' },
  }
  const { iconSize, textSize } = sizeMap[size]

  return (
    <div className="flex items-center gap-2 select-none">
      <svg
        className={`${iconSize} text-[#ea4c89] flex-shrink-0`}
        viewBox="0 0 16 16"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fillRule="evenodd" d="M8 0C3.584 0 0 3.584 0 8s3.584 8 8 8c4.408 0 8-3.584 8-8s-3.592-8-8-8zm5.284 3.688a6.8 6.8 0 0 1 1.545 4.251c-.226-.043-2.482-.503-4.755-.217-.052-.112-.096-.234-.148-.355-.139-.33-.295-.668-.451-.99 2.516-1.023 3.662-2.498 3.81-2.69zM8 1.18c1.735 0 3.323.65 4.53 1.718-.122.174-1.155 1.553-3.584 2.464-1.12-2.056-2.36-3.74-2.551-4A7 7 0 0 1 8 1.18m-2.907.642A43 43 0 0 1 7.627 5.77c-3.193.85-6.013.833-6.317.833a6.87 6.87 0 0 1 3.783-4.78zM1.163 8.01V7.8c.295.01 3.61.053 7.02-.971.199.381.381.772.555 1.162l-.27.078c-3.522 1.137-5.396 4.243-5.553 4.504a6.82 6.82 0 0 1-1.752-4.564zM8 14.837a6.8 6.8 0 0 1-4.19-1.44c.12-.252 1.509-2.924 5.361-4.269.018-.009.026-.009.044-.017a28.3 28.3 0 0 1 1.457 5.18A6.7 6.7 0 0 1 8 1.18m-3.81-1.171c-.07-.417-.435-2.412-1.328-4.868 2.143-.338 4.017.217 4.251.295a6.77 6.77 0 0 1-2.924 4.573z" />
      </svg>
      <span
        style={{ fontFamily: "'Pacifico', cursive" }}
        className={`tracking-normal text-[#0d0c22] font-normal pb-0.5 leading-none ${textSize}`}
      >
        Dribbble
      </span>
    </div>
  )
}
```

### `src/components/ui/Button.tsx`
```typescript
import { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'google'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = ({ variant = 'primary', size = 'md', isLoading, className, children, ...props }: ButtonProps) => {
  return (
    <button
      disabled={isLoading || props.disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-voxel-teal text-voxel-black hover:bg-voxel-cyan hover:shadow-lg hover:shadow-voxel-teal/20',
        variant === 'secondary' && 'border border-voxel-gray-dark text-voxel-white hover:bg-voxel-white/10',
        variant === 'ghost' && 'text-voxel-gray hover:text-voxel-white hover:bg-voxel-white/5',
        variant === 'google' && 'border border-voxel-gray-dark bg-voxel-white/5 text-voxel-white hover:bg-voxel-white/10',
        size === 'sm' && 'px-4 py-1.5 text-xs',
        size === 'md' && 'px-6 py-3 text-sm',
        size === 'lg' && 'px-8 py-3.5 text-base',
        className
      )}
      {...props}
    >
      {isLoading && <span className="w-4 h-4 border-2 border-voxel-black/30 border-t-voxel-black rounded-full animate-spin mr-2" />}
      {children}
    </button>
  )
}
```

### `src/components/ui/Input.tsx`
```typescript
import { InputHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = ({ label, error, className, id, ...props }: InputProps) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label htmlFor={inputId} className="text-xs font-medium text-voxel-gray tracking-wide">{label}</label>}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-xl border border-voxel-gray-dark bg-voxel-white/5 px-4 py-3 text-sm text-voxel-white placeholder:text-voxel-gray focus:outline-none focus:border-voxel-teal focus:ring-1 focus:ring-voxel-teal transition-all duration-200',
          error && 'border-voxel-red focus:border-voxel-red focus:ring-voxel-red',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-voxel-red mt-0.5">{error}</span>}
    </div>
  )
}
```

---

## 9. Сторінки Auth

### `src/pages/auth/LoginPage.tsx`
Компоненти:
- Фоновий image (пейзаж — природа) — `<img src={heroBackground} className="fixed inset-0 w-full h-full object-cover" />`
- Glassmorphism card: `backdrop-blur-xl bg-voxel-white/20 border border-voxel-white/30 rounded-3xl p-10`
- `<Logo />` — зверху по центру
- H1: "Welcome back"
- `<Button variant="google">` — "Login with Google account" з Google icon
- Роздільник: `<div>or</div>`
- `<Input type="email" placeholder="Enter email address" />`
- `<Input type="password" placeholder="Enter your password" />`
- `<Button variant="primary" className="w-full">` — "Continue"
- Text: "By continuing, you agree to our Terms and Privacy Policy."
- Link: "Don't have an account? Sign up"

**Дані від бекенду:** `POST /api/auth/login/` → `{ access, refresh }`, потім `GET /api/auth/profile/`

### `src/pages/auth/RegisterPage.tsx`
- Фоновий image (пейзаж — природа)
- Glassmorphism card: `backdrop-blur-xl bg-voxel-white/20 border border-voxel-white/30 rounded-3xl p-10`
- `<Logo />`
- H1: "Create your account"
- `<Button variant="google">` — "Sign up with Google"
- Роздільник: `<div>or</div>`
- `<Input type="text" placeholder="Username" />`
- `<Input type="email" placeholder="Enter email address" />`
- `<Input type="password" placeholder="Create password" />`
- `<Input type="password" placeholder="Confirm password" />`
- `<Button variant="primary" className="w-full">` — "Create account"
- Link: "Already have an account? Sign in"

**Дані від бекенду:** `POST /api/auth/register/`

### `src/pages/auth/ForgotPasswordPage.tsx`
- Фоновий image
- Glassmorphism card: `backdrop-blur-xl bg-voxel-white/20 border border-voxel-white/30 rounded-3xl p-10`
- `<Logo />`
- H1: "Reset your password"
- `<Input type="email" placeholder="Enter your email" />`
- `<Button variant="primary" className="w-full">` — "Send recovery link"
- Link: "← Back to Sign in"

**Дані від бекенду:** `POST /api/auth/password/reset/` (надсилає лист із посиланням, що містить `uid` та `token`)

### `src/pages/auth/ForgotPasswordConfirmPage.tsx`
- Фоновий image
- Glassmorphism card: `backdrop-blur-xl bg-voxel-white/20 border border-voxel-white/30 rounded-3xl p-10`
- `<Logo />`
- URL-шлях: `/forgot-password/confirm?uid=...&token=...` (зчитує `uid` та `token` з URL)
- H1: "Set new password"
- `<Input type="password" placeholder="New password" />`
- `<Input type="password" placeholder="Confirm new password" />`
- `<Button variant="primary" className="w-full">` — "Reset password"
- Link: "← Back to Sign in"

**Дані від бекенду:** `POST /api/auth/password/reset/confirm/` (надсилає `{ uid, token, new_password1, new_password2 }`)

---

## 10. Settings Page (`src/pages/SettingsPage.tsx`)

Сторінка з налаштуваннями акаунту. Відповідно до Figma — форма у карточці.

**Компоненти:**
- `<Layout />` (Navbar вже є)
- `<AvatarUploader />` — аватар + кнопка зміни
- `<Input disabled />` — username (не редагується)
- `<Input disabled />` — email (не редагується)
- `<Textarea />` — bio
- `<Input type="url" />` — website
- `<Input type="url" />` — twitter, instagram, linkedin
- `<Button>` — "Save changes"
- Секція зміни паролю: old_password, new_password, confirm
- `<Button>` — "Change password"

**Дані від бекенду:**
- `GET /api/auth/profile/` — початкове заповнення форми
- `PATCH /api/auth/profile/` — збереження (multipart якщо є аватар)
- `POST /api/auth/password/change/` — зміна паролю

---

## 11. Layout (`src/components/layout/Layout.tsx`)

```typescript
import { Outlet } from 'react-router'
import { Navbar } from './Navbar'

export const Layout = () => (
  <div className="min-h-screen bg-voxel-black text-voxel-white">
    <Navbar />
    <main>
      <Outlet />
    </main>
  </div>
)
```

### `src/components/layout/Navbar.tsx`
**З дизайну Figma — Navbar містить:**
- Ліво: `<Logo size="sm" />`
- Центр: search input + navigation links (Inspiration, Find work, Learn)
- Право (гість): Sign in + Sign up кнопки
- Право (авторизований): Upload button + Avatar dropdown (Profile, Settings, Logout)

```typescript
import { Link } from 'react-router'
import { useAuthStore } from '../../store/authStore'
import { Logo } from '../ui/Logo'
import { Upload } from 'lucide-react'

export const Navbar = () => {
  const { user, logout } = useAuthStore()

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link to="/feed"><Logo size="sm" /></Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <Link to="/feed" className="hover:text-gray-900">Inspiration</Link>
          <a href="#" className="hover:text-gray-900">Find work</a>
          <a href="#" className="hover:text-gray-900">Learn</a>
        </nav>

        {/* Search */}
        <div className="flex-1 max-w-xs hidden md:block">
          {/* Пошук — імплементується у Фазі 2 */}
          <input placeholder="Search..." className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm" />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/upload" className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-600 text-white text-sm font-semibold hover:bg-pink-700">
                <Upload className="w-4 h-4" /> Upload
              </Link>
              {/* Avatar dropdown — деталі у Фазі 2 */}
              <img src={user.avatar || ''} alt={user.username} className="w-9 h-9 rounded-full object-cover border border-gray-200 cursor-pointer" />
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">Sign in</Link>
              <Link to="/register" className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
```

---

## 12. Інтеграція з бекендом

1. Змінити `.env`: `VITE_USE_MOCKS=false`, `VITE_API_BASE_URL=http://localhost:8000/api`
2. MSW автоматично вимкнеться, запити підуть на реальний backend
3. Перевірити CORS на бекенді (origin: `http://localhost:5173`)
