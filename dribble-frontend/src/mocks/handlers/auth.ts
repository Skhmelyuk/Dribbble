import { http, HttpResponse } from 'msw'
import { mockCurrentUser } from '../data/currentUser'
import { mockShots } from './shots'
import { getFollowerUsernames, getFollowingUsernames } from '../data/follows'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// Track registered users for mock validation
const registeredUsers: Array<{ email: string; username: string; password: string }> = [
  { email: 'designer@example.com', username: 'kyiv_creator', password: 'PassWord123!' },
]

const buildFullProfileResponse = () => ({
  ...mockCurrentUser,
  shots_count: mockShots.filter((s) => s.author.username === mockCurrentUser.username).length,
  followers_count: getFollowerUsernames(mockCurrentUser.username).length,
  following_count: getFollowingUsernames(mockCurrentUser.username).length,
})

export const authHandlers = [
  //POST /auth/register/
  http.post(`${BASE_URL}/auth/register/`, async ({ request }) => {
    const body = (await request.json()) as {
      email?: string
      username?: string
      password?: string
      password2?: string
    }

    if (!body.email || !body.username || !body.password || !body.password2) {
      return HttpResponse.json(
        { detail: 'Не всі обов\'язкові поля заповнено.' },
        { status: 400 }
      )
    }

    if (body.password !== body.password2) {
      return HttpResponse.json(
        { password: ['Паролі не співпадають.'] },
        { status: 400 }
      )
    }

    const emailExists = registeredUsers.some((u) => u.email === body.email)
    if (emailExists) {
      return HttpResponse.json(
        { email: ['Користувач з таким email вже існує.'] },
        { status: 400 }
      )
    }

    const usernameExists = registeredUsers.some((u) => u.username === body.username)
    if (usernameExists) {
      return HttpResponse.json(
        { username: ['Користувач з таким іменем вже існує.'] },
        { status: 400 }
      )
    }

    registeredUsers.push({
      email: body.email,
      username: body.username,
      password: body.password,
    })

    mockCurrentUser.email = body.email
    mockCurrentUser.username = body.username

    return HttpResponse.json(
      { id: mockCurrentUser.id, email: body.email, username: body.username },
      { status: 201 }
    )
  }),

  //POST /auth/login/
  http.post(`${BASE_URL}/auth/login/`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string }

    const user = registeredUsers.find(
      (u) => u.email === body.email && u.password === body.password
    )

    if (!user) {
      return HttpResponse.json(
        { detail: 'Невірні облікові дані.' },
        { status: 401 }
      )
    }

    return HttpResponse.json(
      {
        access: 'mock-access-token-jwt-12345',
        refresh: 'mock-refresh-token-jwt-67890',
      },
      { status: 200 }
    )
  }),

  //POST /auth/token/refresh/
  http.post(`${BASE_URL}/auth/token/refresh/`, async ({ request }) => {
    const body = (await request.json()) as { refresh?: string }

    if (!body.refresh) {
      return HttpResponse.json(
        { detail: 'Refresh token не надано.' },
        { status: 400 }
      )
    }

    return HttpResponse.json(
      { access: `new-mock-access-token-jwt-${Math.random().toString(36).substring(2, 9)}` },
      { status: 200 }
    )
  }),

  //POST /auth/google/
  http.post(`${BASE_URL}/auth/google/`, async ({ request }) => {
    const body = (await request.json()) as { token?: string }

    if (!body.token) {
      return HttpResponse.json(
        { detail: 'Token is required' },
        { status: 400 }
      )
    }

    const isNew = !registeredUsers.some((u) => u.email === 'google@example.com')
    if (isNew) {
      registeredUsers.push({
        email: 'google@example.com',
        username: 'google_user',
        password: '',
      })
      mockCurrentUser.email = 'google@example.com'
      mockCurrentUser.username = 'google_user'
      mockCurrentUser.avatar =
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80'
    }

    return HttpResponse.json(
      {
        access: 'google-mock-access-token',
        refresh: 'google-mock-refresh-token',
        created: isNew,
      },
      { status: 200 }
    )
  }),

  //GET /auth/profile/
  http.get(`${BASE_URL}/auth/profile/`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Облікові дані не надано.' },
        { status: 401 }
      )
    }

    return HttpResponse.json(buildFullProfileResponse(), { status: 200 })
  }),

  //PATCH /auth/profile/
  http.patch(`${BASE_URL}/auth/profile/`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Облікові дані не надано.' },
        { status: 401 }
      )
    }

    const contentType = request.headers.get('Content-Type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      const avatarFile = formData.get('avatar') as File | null
      if (avatarFile && avatarFile.size > 0) {
        mockCurrentUser.avatar = URL.createObjectURL(avatarFile)
      }

      for (const [key, value] of formData.entries()) {
        if (key !== 'avatar' && key in mockCurrentUser) {
          ;(mockCurrentUser as unknown as Record<string, unknown>)[key] = value as string
        }
      }
    } else {
      const body = (await request.json()) as Partial<typeof mockCurrentUser>
      Object.assign(mockCurrentUser, body)
    }

    return HttpResponse.json(buildFullProfileResponse(), { status: 200 })
  }),

  //POST /auth/password/change/ — зміна паролю з форми Settings
  http.post(`${BASE_URL}/auth/password/change/`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Облікові дані не надано.' }, { status: 401 })
    }

    const body = (await request.json()) as {
      old_password?: string
      new_password?: string
      new_password2?: string
    }

    if (!body.old_password || !body.new_password || !body.new_password2) {
      return HttpResponse.json(
        { detail: 'Не всі обов\'язкові поля заповнено.' },
        { status: 400 }
      )
    }

    if (body.new_password !== body.new_password2) {
      return HttpResponse.json({ new_password2: ['Паролі не співпадають.'] }, { status: 400 })
    }

    const currentUser = registeredUsers.find((u) => u.email === mockCurrentUser.email)
    if (!currentUser || currentUser.password !== body.old_password) {
      return HttpResponse.json({ old_password: ['Неправильний поточний пароль.'] }, { status: 400 })
    }

    currentUser.password = body.new_password
    return HttpResponse.json({ detail: 'Пароль успішно змінено.' }, { status: 200 })
  }),

  //Password recovery
  http.post(`${BASE_URL}/auth/password-reset/`, () => {
    return HttpResponse.json(
      { detail: 'Функція відновлення пароля ще не реалізована на сервері.' },
      { status: 501 }
    )
  }),

  http.post(`${BASE_URL}/auth/password-reset/confirm/`, () => {
    return HttpResponse.json(
      { detail: 'Функція підтвердження нового пароля ще не реалізована на сервері.' },
      { status: 501 }
    )
  }),
]
