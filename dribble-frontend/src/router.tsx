import { createBrowserRouter } from 'react-router'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute, GuestRoute } from './components/routing/RouteGuards'

//Router
export const router = createBrowserRouter([
  // Публічна головна сторінка — перша точка входу для будь-якого відвідувача.
  // Доступна і гостям, і автентифікованим юзерам (Navbar сам показує потрібний стан — "Вхід/Реєстрація" або аватар користувача).
  {
    Component: Layout,
    children: [
      {
        path: '/',
        lazy: () => import('./pages/HomePage').then((m) => ({ Component: m.HomePage })),
      },
      // Стрічка робіт — публічна (GET /api/shots/ доступний і гостям)
      {
        path: '/feed',
        lazy: () => import('./pages/FeedPage').then((m) => ({ Component: m.FeedPage })),
      },
      // Детальна сторінка Shot — публічна
      {
        path: '/shot/:id',
        lazy: () => import('./pages/ShotDetailPage').then((m) => ({ Component: m.ShotDetailPage })),
      },
      // Публічний профіль користувача (Social API)
      {
        path: '/users/:username',
        lazy: () => import('./pages/UserProfilePage').then((m) => ({ Component: m.UserProfilePage })),
      },
      // Глобальний пошук ( Search API)
      {
        path: '/search',
        lazy: () => import('./pages/SearchPage').then((m) => ({ Component: m.SearchPage })),
      },
    ],
  },

  // Guest-only routes — якщо юзер вже залогінений, його перекине на /profile
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
        path: '/recovery',
        lazy: () => import('./pages/auth/RecoveryPage').then((m) => ({ Component: m.RecoveryPage })),
      },
    ],
  },

  // Protected routes
  {
    Component: ProtectedRoute,
    children: [
      {
        Component: Layout,
        children: [
          {
            path: '/profile',
            lazy: () =>
              import('./pages/ProfilePage').then((m) => ({ Component: m.ProfilePage })),
          },
          // Публікація Shot — потребує авторизації (POST /api/shots/, Фаза 0)
          {
            path: '/upload',
            lazy: () => import('./pages/UploadPage').then((m) => ({ Component: m.UploadPage })),
          },
        ],
      },
    ],
  },

  // 404
  {
    path: '*',
    lazy: () =>
      import('./pages/NotFoundPage').then((m) => ({ Component: m.NotFoundPage })),
  },
])
