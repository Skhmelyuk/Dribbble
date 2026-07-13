import { http, HttpResponse } from 'msw'
import { mockShots, serializeShot } from './shots'
import { getUsersDirectory } from '../data/users'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const searchHandlers = [
  // GET /search/?q=&type=&limit=&offset=
  http.get(`${BASE_URL}/search/`, ({ request }) => {
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').toLowerCase().trim()
    const type = url.searchParams.get('type')

    const shotsResults = q
      ? mockShots
          .filter((s) => s.title.toLowerCase().includes(q) || s.tags.some((t) => t.includes(q)))
          .map(serializeShot)
      : []

    // Каталог користувачів (єдине джерело правди — src/mocks/data/users.ts)
    const usersResults = q
      ? getUsersDirectory()
          .filter((u) => u.username.toLowerCase().includes(q) || u.bio.toLowerCase().includes(q))
          .map((u) => ({ id: u.id, username: u.username, avatar: u.avatar, bio: u.bio }))
      : []

    const response: Record<string, unknown> = {}

    if (!type || type === 'shots') {
      response.shots = { count: shotsResults.length, results: shotsResults }
    }
    if (!type || type === 'users') {
      response.users = { count: usersResults.length, results: usersResults }
    }

    return HttpResponse.json(response, { status: 200 })
  }),
]
