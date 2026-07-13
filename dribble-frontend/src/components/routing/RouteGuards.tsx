import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '../../store/authStore'

// Захищений маршрут — редиректить на /login якщо немає токена
export const ProtectedRoute = () => {
  const token = useAuthStore((state) => state.accessToken)
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

// Гостьовий маршрут — редиректить на /profile якщо юзер вже залогінений
export const GuestRoute = () => {
  const token = useAuthStore((state) => state.accessToken)
  if (token) return <Navigate to="/profile" replace />
  return <Outlet />
}