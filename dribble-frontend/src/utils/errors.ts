import type { ApiError } from '../types'

interface ErrorLike {
  response?: { status?: number; data?: ApiError }
  message?: string
}

// Дістає перше повідомлення про помилку з відповіді DRF
// (формат: { detail: "..." } або { field: ["..."] })
export function getErrorMessage(error: unknown, fallback = 'Сталася помилка. Спробуйте ще раз.'): string {
  const err = error as ErrorLike
  const data = err?.response?.data

  if (!err?.response) {
    // Запит не дійшов до сервера (бекенд не запущено / немає мережі)
    return 'Не вдалося з\'єднатися з сервером. Перевірте підключення або спробуйте пізніше.'
  }

  if (!data) return fallback
  if (data.detail) return data.detail

  const firstKey = Object.keys(data)[0]
  if (firstKey) {
    const val = data[firstKey]
    return Array.isArray(val) ? val[0] ?? fallback : (val ?? fallback)
  }

  return fallback
}

// Повертає назву поля, яке викликало помилку (email/username/password/...),
// щоб майстер реєстрації міг повернути користувача на потрібний крок.
export function getErrorField(error: unknown): string | null {
  const err = error as ErrorLike
  const data = err?.response?.data
  if (!data) return null
  const keys = Object.keys(data).filter((k) => k !== 'detail')
  return keys[0] ?? null
}

// Чи означає помилка, що ендпоінт ще не реалізований на бекенді (404 / network)
export function isNotImplemented(error: unknown): boolean {
  const err = error as ErrorLike
  return !err?.response || err.response.status === 404
}
