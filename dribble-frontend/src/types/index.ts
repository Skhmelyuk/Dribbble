//Auth / User

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

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
  password2: string
}

export interface RegisterResponse {
  id: number
  email: string
  username: string
}

export interface TokenRefreshRequest {
  refresh: string
}

export interface TokenRefreshResponse {
  access: string
}

export interface GoogleLoginRequest {
  token: string
}

export interface GoogleLoginResponse {
  access: string
  refresh: string
  created: boolean
}

// Відновлення пароля
// Ці ендпоінти ще не описані в Фазі 0 API контракту і не реалізовані на
// бекенді. Інтерфейси та клієнтські виклики підготовлені наперед, щоб
// підключення відбулося без змін на фронтенді, щойно бекенд їх додасть.
// Поки що UI обробляє відсутність цих ендпоінтів коректно (повідомлення
// "функція ще не підтримується сервером").

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirmRequest {
  email: string
  password: string
  password2: string
}

// Зміна паролю з профілю (Фаза 1, Settings)
// POST /api/auth/password/change/
export interface PasswordChangeRequest {
  old_password: string
  new_password: string
  new_password2: string
}

//Shots

export interface ShotAuthor {
  id: number
  username: string
  avatar: string | null
}

export interface Shot {
  id: number
  title: string
  description: string
  image: string
  preview: string
  tags: string[]
  author: ShotAuthor
  likes_count: number
  comments_count: number
  is_liked: boolean
  is_saved: boolean
  created_at: string
}

//Comments

export interface Comment {
  id: number
  text: string
  author: ShotAuthor
  created_at: string
}

//Публічний профіль користувача (GET /api/users/:username/)

export interface PublicProfile {
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

// Короткий профіль користувача для списків підписників/підписок
// (GET /api/users/:username/followers/, /following/) — Фаза 3
export interface FollowUser {
  id: number
  username: string
  avatar: string | null
  bio: string
}

//Search API (GET /api/search/)

export interface SearchUserResult {
  id: number
  username: string
  avatar: string | null
  bio: string
}

export interface SearchResponse {
  shots: {
    count: number
    results: Shot[]
  }
  users: {
    count: number
    results: SearchUserResult[]
  }
}

//Pagination

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

//API Errors
export interface ApiError {
  detail?: string
  [field: string]: string | string[] | undefined
}
