import { http, HttpResponse } from 'msw'
import type { Shot } from '../../types'
import { mockCurrentUser } from '../data/currentUser'
import { MOCK_OTHER_USERS, toShotAuthor } from '../data/users'
import { currentUserLikes, setCurrentUserLike } from '../data/likes'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const lvivDesigner = MOCK_OTHER_USERS.find((u) => u.username === 'lviv_designer')!
const odesaCreative = MOCK_OTHER_USERS.find((u) => u.username === 'odesa_creative')!

//In-memory мокова база

export const mockShots: Shot[] = [
  {
    id: 101,
    title: 'Minimalist Task Manager App',
    description:
      'Clean UI concept for a mobile productivity app featuring dark mode, glassmorphism card layout, and smooth micro-animations.',
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    preview:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=300&q=80',
    tags: ['mobile', 'productivity', 'glassmorphism'],
    author: toShotAuthor(mockCurrentUser),
    likes_count: 42,
    comments_count: 5,
    is_liked: false,
    is_saved: false,
    created_at: '2026-06-12T14:20:00Z',
  },
  {
    id: 102,
    title: 'E-Commerce Dashboard analytics',
    description:
      'Web responsive SaaS tool dashboard displaying metrics, charts and conversion paths. Optimized with custom Tailwind themes.',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    preview:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&h=300&q=80',
    tags: ['web', 'dashboard', 'saas'],
    author: toShotAuthor(lvivDesigner),
    likes_count: 108,
    comments_count: 12,
    is_liked: true,
    is_saved: false,
    created_at: '2026-06-10T09:15:00Z',
  },
  {
    id: 103,
    title: 'Mobile Banking App Redesign',
    description:
      'A modern banking app redesign concept with focus on accessibility and quick transaction flows.',
    image:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    preview:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&h=300&q=80',
    tags: ['mobile', 'banking', 'ui'],
    author: toShotAuthor(mockCurrentUser),
    likes_count: 128,
    comments_count: 14,
    is_liked: false,
    is_saved: false,
    created_at: '2026-06-07T10:30:00Z',
  },
  {
    id: 104,
    title: 'Landing Page for SaaS Startup',
    description:
      'Bold, conversion-focused landing page concept with a custom brand identity, gradient accents and animated hero section.',
    image:
      'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1200&q=80',
    preview:
      'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=400&h=300&q=80',
    tags: ['web design', 'branding', 'saas'],
    author: toShotAuthor(odesaCreative),
    likes_count: 76,
    comments_count: 3,
    is_liked: false,
    is_saved: false,
    created_at: '2026-06-14T08:05:00Z',
  },
]

// Повертає копію роботи з актуальним `is_liked` (з реєстру лайків поточного користувача)
export const serializeShot = (shot: Shot): Shot => ({
  ...shot,
  author: shot.author.id === mockCurrentUser.id ? toShotAuthor(mockCurrentUser) : shot.author,
  is_liked: currentUserLikes(shot.id),
})

export const shotsHandlers = [
  // GET /shots/ — список з фільтрацією, пошуком та пагінацією (формат Фази 0)
  http.get(`${BASE_URL}/shots/`, ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '12', 10)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)
    const search = url.searchParams.get('search')?.toLowerCase()
    const tagsParam = url.searchParams.get('tags')
    const authorParam = url.searchParams.get('author')

    let filtered = [...mockShots]

    if (authorParam) {
      filtered = filtered.filter((s) => s.author.id.toString() === authorParam)
    }

    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(search) || s.description.toLowerCase().includes(search)
      )
    }

    if (tagsParam) {
      const tagsList = tagsParam.split(',').map((t) => t.trim().toLowerCase())
      filtered = filtered.filter((s) => tagsList.every((tag) => s.tags.includes(tag)))
    }

    const sliced = filtered.slice(offset, offset + limit).map(serializeShot)
    const nextOffset = offset + limit
    const hasNext = nextOffset < filtered.length

    const nextUrl = hasNext
      ? `${BASE_URL}/shots/?limit=${limit}&offset=${nextOffset}${search ? `&search=${search}` : ''}${
          tagsParam ? `&tags=${tagsParam}` : ''
        }`
      : null

    const previousUrl =
      offset > 0 ? `${BASE_URL}/shots/?limit=${limit}&offset=${Math.max(0, offset - limit)}` : null

    return HttpResponse.json(
      {
        count: filtered.length,
        next: nextUrl,
        previous: previousUrl,
        results: sliced,
      },
      { status: 200 }
    )
  }),

  // GET /shots/:id/ — детальна сторінка
  http.get(`${BASE_URL}/shots/:id/`, ({ params }) => {
    const id = parseInt(params.id as string, 10)
    const shot = mockShots.find((s) => s.id === id)
    if (!shot) {
      return HttpResponse.json({ detail: 'Роботу не знайдено.' }, { status: 404 })
    }
    return HttpResponse.json(serializeShot(shot), { status: 200 })
  }),

  // POST /shots/ — публікація (multipart/form-data)
  http.post(`${BASE_URL}/shots/`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Облікові дані не надано.' }, { status: 401 })
    }

    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = (formData.get('description') as string) || ''
    const tagsRaw = (formData.get('tags') as string) || ''
    const imageFile = formData.get('image') as File | null

    if (!title || !imageFile) {
      return HttpResponse.json({ detail: 'Назва та файл зображення обовʼязкові.' }, { status: 400 })
    }

    const tagsList = tagsRaw
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
    const imageObjectURL = URL.createObjectURL(imageFile)

    const newShot: Shot = {
      id: Math.floor(Math.random() * 10000) + 200,
      title,
      description,
      image: imageObjectURL,
      preview: imageObjectURL,
      tags: tagsList,
      author: toShotAuthor(mockCurrentUser),
      likes_count: 0,
      comments_count: 0,
      is_liked: false,
      is_saved: false,
      created_at: new Date().toISOString(),
    }

    mockShots.unshift(newShot)
    return HttpResponse.json(newShot, { status: 201 })
  }),

  // PATCH /shots/:id/ — редагування (тільки автор — у моку не перевіряється власник)
  http.patch(`${BASE_URL}/shots/:id/`, async ({ params, request }) => {
    const id = parseInt(params.id as string, 10)
    const shot = mockShots.find((s) => s.id === id)
    if (!shot) {
      return HttpResponse.json({ detail: 'Роботу не знайдено.' }, { status: 404 })
    }
    const body = (await request.json()) as Partial<Pick<Shot, 'title' | 'description'>>
    Object.assign(shot, body)
    return HttpResponse.json(serializeShot(shot), { status: 200 })
  }),

  // DELETE /shots/:id/
  http.delete(`${BASE_URL}/shots/:id/`, ({ params }) => {
    const id = parseInt(params.id as string, 10)
    const index = mockShots.findIndex((s) => s.id === id)
    if (index === -1) {
      return HttpResponse.json({ detail: 'Роботу не знайдено.' }, { status: 404 })
    }
    mockShots.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // POST /shots/:id/like/ — toggle лайку
  http.post(`${BASE_URL}/shots/:id/like/`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Облікові дані не надано.' }, { status: 401 })
    }
    const id = parseInt(params.id as string, 10)
    const shot = mockShots.find((s) => s.id === id)
    if (!shot) {
      return HttpResponse.json({ detail: 'Роботу не знайдено.' }, { status: 404 })
    }
    const nextLiked = !currentUserLikes(id)
    setCurrentUserLike(id, nextLiked)
    shot.likes_count += nextLiked ? 1 : -1
    return HttpResponse.json({ is_liked: nextLiked, likes_count: shot.likes_count }, { status: 200 })
  }),

  // POST /shots/:id/save/ — toggle збереження
  http.post(`${BASE_URL}/shots/:id/save/`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Облікові дані не надано.' }, { status: 401 })
    }
    const id = parseInt(params.id as string, 10)
    const shot = mockShots.find((s) => s.id === id)
    if (!shot) {
      return HttpResponse.json({ detail: 'Роботу не знайдено.' }, { status: 404 })
    }
    shot.is_saved = !shot.is_saved
    return HttpResponse.json({ is_saved: shot.is_saved }, { status: 200 })
  }),
]
