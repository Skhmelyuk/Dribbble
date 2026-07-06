# Фаза 2: Shots та Feed (Фронтенд) — [СКОРИГОВАНА]

> Скориговано на основі аналізу дизайну Figma (design_analysis.md).
> Додані: Navbar з пошуком, ProfilePage з вкладками, ShotDetailPage повноцінна.

---

## 1. Встановлення залежностей та оновлення роутингу

```bash
npm install lucide-react
```

### Оновлений `src/router.tsx`

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
  { path: '/', loader: () => { throw redirect('/feed') } },

  // Guest routes (auth pages)
  {
    Component: GuestRoute,
    children: [
      { path: '/login', lazy: () => import('./pages/auth/LoginPage').then((m) => ({ Component: m.LoginPage })) },
      { path: '/register', lazy: () => import('./pages/auth/RegisterPage').then((m) => ({ Component: m.RegisterPage })) },
      { path: '/forgot-password', lazy: () => import('./pages/auth/ForgotPasswordPage').then((m) => ({ Component: m.ForgotPasswordPage })) },
      { path: '/forgot-password/confirm', lazy: () => import('./pages/auth/ForgotPasswordConfirmPage').then((m) => ({ Component: m.ForgotPasswordConfirmPage })) },
    ],
  },

  // Public + Protected routes (з Navbar)
  {
    Component: Layout,
    children: [
      // Public
      { path: '/feed', lazy: () => import('./pages/FeedPage').then((m) => ({ Component: m.FeedPage })) },
      { path: '/shot/:id', lazy: () => import('./pages/ShotDetailPage').then((m) => ({ Component: m.ShotDetailPage })) },
      { path: '/profile/:username', lazy: () => import('./pages/ProfilePage').then((m) => ({ Component: m.ProfilePage })) },

      // Auth required
      {
        Component: ProtectedRoute,
        children: [
          { path: '/upload', lazy: () => import('./pages/UploadPage').then((m) => ({ Component: m.UploadPage })) },
          { path: '/settings', lazy: () => import('./pages/SettingsPage').then((m) => ({ Component: m.SettingsPage })) },
        ],
      },
    ],
  },

  { path: '*', lazy: () => import('./pages/NotFoundPage').then((m) => ({ Component: m.NotFoundPage })) },
])
```

---

## 2. Типи (`src/types/shot.ts`)

```typescript
import { PublicUser } from './user'

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
  preview: string | null
  tags: string[]
  author: ShotAuthor
  likes_count: number
  comments_count: number
  is_liked: boolean
  is_saved: boolean
  created_at: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
```

---

## 3. API функції (`src/api/shots.ts`)

```typescript
import { api } from './index'
import { Shot, PaginatedResponse } from '../types/shot'

export interface GetShotsParams {
  limit?: number
  offset?: number
  search?: string
  tags?: string
  author?: number | string   // для ProfilePage — фільтр по автору
}

export const shotsApi = {
  getShots: (params: GetShotsParams) =>
    api.get<PaginatedResponse<Shot>>('/shots/', { params }),

  getShot: (id: string | number) =>
    api.get<Shot>(`/shots/${id}/`),

  createShot: (formData: FormData) =>
    api.post<Shot>('/shots/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  updateShot: (id: string | number, data: Partial<Pick<Shot, 'title' | 'description'>>) =>
    api.patch<Shot>(`/shots/${id}/`, data),

  deleteShot: (id: string | number) =>
    api.delete(`/shots/${id}/`),
}
```

---

## 4. API функції (`src/api/users.ts`)

```typescript
import { api } from './index'
import { PublicUser } from '../types/user'

export const usersApi = {
  // Публічний профіль — GET /api/users/:username/
  getPublicProfile: (username: string) =>
    api.get<PublicUser>(`/users/${username}/`),
}
```

---

## 5. TanStack Query Хуки (`src/hooks/useShots.ts`)

```typescript
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { shotsApi, GetShotsParams } from '../api/shots'

// Feed з нескінченною прокруткою
export const useFeedQuery = (filters: Omit<GetShotsParams, 'limit' | 'offset'>) => {
  return useInfiniteQuery({
    queryKey: ['feed', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await shotsApi.getShots({ offset: pageParam as number, limit: 12, ...filters })
      return response.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined
      try {
        return parseInt(new URL(lastPage.next).searchParams.get('offset') || '0', 10)
      } catch { return undefined }
    },
  })
}

// Shots конкретного автора (для ProfilePage)
export const useAuthorShotsQuery = (authorId: number | undefined) => {
  return useInfiniteQuery({
    queryKey: ['authorShots', authorId],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await shotsApi.getShots({ author: authorId, offset: pageParam as number, limit: 12 })
      return response.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined
      try {
        return parseInt(new URL(lastPage.next).searchParams.get('offset') || '0', 10)
      } catch { return undefined }
    },
    enabled: !!authorId,
  })
}

// Один shot (для ShotDetailPage)
export const useShotQuery = (id: string | number) => {
  return useQuery({
    queryKey: ['shot', id],
    queryFn: async () => (await shotsApi.getShot(id)).data,
    enabled: !!id,
  })
}

// Створення
export const useCreateShotMutation = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: shotsApi.createShot,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      navigate(`/shot/${response.data.id}`)
    },
  })
}

// Видалення
export const useDeleteShotMutation = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: shotsApi.deleteShot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      navigate('/feed')
    },
  })
}
```

---

## 6. TanStack Query Хуки (`src/hooks/useUsers.ts`)

```typescript
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '../api/users'

// Публічний профіль для ProfilePage
export const usePublicProfileQuery = (username: string | undefined) => {
  return useQuery({
    queryKey: ['publicProfile', username],
    queryFn: async () => (await usersApi.getPublicProfile(username!)).data,
    enabled: !!username,
  })
}
```

---

## 7. MSW Handlers (`src/mocks/handlers/shots.ts`)

```typescript
import { http, HttpResponse } from 'msw'
import { Shot } from '../../types/shot'

const BASE_URL = 'http://localhost:8000/api'

let mockShots: Shot[] = [
  {
    id: 101,
    title: 'Minimalist Task Manager App',
    description: 'Clean UI concept with dark mode and glassmorphism cards.',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    preview: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=300&q=80',
    tags: ['mobile', 'productivity', 'glassmorphism'],
    author: { id: 1, username: 'kyiv_creator', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80' },
    likes_count: 42, comments_count: 5, is_liked: false, is_saved: false,
    created_at: '2026-06-12T14:20:00Z'
  },
  {
    id: 102,
    title: 'E-Commerce Dashboard Analytics',
    description: 'SaaS dashboard with charts and conversion metrics.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    preview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&h=300&q=80',
    tags: ['web', 'dashboard', 'saas'],
    author: { id: 2, username: 'lviv_designer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80' },
    likes_count: 108, comments_count: 12, is_liked: false, is_saved: false,
    created_at: '2026-06-10T09:15:00Z'
  },
  {
    id: 103,
    title: 'Travel App Landing Page',
    description: 'Vibrant landing for a travel booking app.',
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80',
    preview: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=400&h=300&q=80',
    tags: ['web', 'landing', 'travel'],
    author: { id: 3, username: 'odesa_creative', avatar: null },
    likes_count: 67, comments_count: 8, is_liked: false, is_saved: false,
    created_at: '2026-06-08T16:30:00Z'
  },
]

export const shotsHandlers = [
  // GET /api/shots/ — list з пагінацією та фільтрами
  http.get(`${BASE_URL}/shots/`, ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '12', 10)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)
    const search = url.searchParams.get('search')?.toLowerCase()
    const tagsParam = url.searchParams.get('tags')
    const authorParam = url.searchParams.get('author')

    let filtered = [...mockShots]

    if (authorParam) filtered = filtered.filter(s => s.author.id.toString() === authorParam)
    if (search) filtered = filtered.filter(s => s.title.toLowerCase().includes(search) || s.description.toLowerCase().includes(search))
    if (tagsParam) {
      const tagsList = tagsParam.split(',').map(t => t.trim().toLowerCase())
      filtered = filtered.filter(s => tagsList.every(tag => s.tags.includes(tag)))
    }

    const sliced = filtered.slice(offset, offset + limit)
    const nextOffset = offset + limit
    const nextUrl = nextOffset < filtered.length ? `${BASE_URL}/shots/?limit=${limit}&offset=${nextOffset}` : null
    const prevUrl = offset > 0 ? `${BASE_URL}/shots/?limit=${limit}&offset=${Math.max(0, offset - limit)}` : null

    return HttpResponse.json({ count: filtered.length, next: nextUrl, previous: prevUrl, results: sliced })
  }),

  // GET /api/shots/:id/
  http.get(`${BASE_URL}/shots/:id/`, ({ params }) => {
    const shot = mockShots.find(s => s.id === parseInt(params.id as string, 10))
    return shot
      ? HttpResponse.json(shot)
      : HttpResponse.json({ detail: 'Не знайдено.' }, { status: 404 })
  }),

  // POST /api/shots/
  http.post(`${BASE_URL}/shots/`, async ({ request }) => {
    if (!request.headers.get('Authorization')?.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Не авторизовано.' }, { status: 401 })
    }
    const formData = await request.formData()
    const title = formData.get('title') as string
    const imageFile = formData.get('image') as File
    if (!title || !imageFile) return HttpResponse.json({ detail: 'title і image обов\'язкові.' }, { status: 400 })

    const tagsRaw = (formData.get('tags') as string) || ''
    const tagsList = tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    const imageUrl = URL.createObjectURL(imageFile)

    const newShot: Shot = {
      id: Math.floor(Math.random() * 10000) + 200,
      title,
      description: (formData.get('description') as string) || '',
      image: imageUrl,
      preview: imageUrl,
      tags: tagsList,
      author: { id: 1, username: 'kyiv_creator', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80' },
      likes_count: 0, comments_count: 0, is_liked: false, is_saved: false,
      created_at: new Date().toISOString()
    }
    mockShots.unshift(newShot)
    return HttpResponse.json(newShot, { status: 201 })
  }),

  // DELETE /api/shots/:id/
  http.delete(`${BASE_URL}/shots/:id/`, ({ params }) => {
    const idx = mockShots.findIndex(s => s.id === parseInt(params.id as string, 10))
    if (idx === -1) return HttpResponse.json({ detail: 'Не знайдено.' }, { status: 404 })
    mockShots.splice(idx, 1)
    return new Response(null, { status: 204 })
  }),
]
```

Оновити `src/mocks/browser.ts`:
```typescript
import { setupWorker } from 'msw/browser'
import { authHandlers } from './handlers/auth'
import { shotsHandlers } from './handlers/shots'

export const worker = setupWorker(...authHandlers, ...shotsHandlers)
```

---

## 8. Компоненти

### `src/components/ui/ShotCard.tsx`

```typescript
import { Link } from 'react-router'
import { Heart, Bookmark } from 'lucide-react'
import { Shot } from '../../types/shot'

interface ShotCardProps {
  shot: Shot
}

export const ShotCard = ({ shot }: ShotCardProps) => {
  return (
    <div className="group relative flex flex-col bg-voxel-white/5 rounded-2xl overflow-hidden border border-voxel-gray-dark hover:border-voxel-gray hover:shadow-2xl hover:shadow-voxel-cyan/5 hover:-translate-y-1 transition-all duration-300">

      {/* Image + Hover Overlay */}
      <div className="relative aspect-[4/3] overflow-hidden bg-voxel-white/5">
        <img
          src={shot.preview || shot.image}
          alt={shot.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-voxel-black/90 via-voxel-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="flex justify-between items-center text-voxel-white">
            <Link to={`/shot/${shot.id}`} className="font-semibold text-sm truncate max-w-[65%] hover:underline">
              {shot.title}
            </Link>
            <div className="flex gap-2">
              <button
                title="Like"
                onClick={(e) => e.preventDefault()}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer border ${shot.is_liked ? 'bg-voxel-red border-voxel-red text-voxel-white' : 'bg-voxel-white/10 border-voxel-white/20 text-voxel-white hover:bg-voxel-red hover:border-voxel-red'}`}
              >
                <Heart className="w-3.5 h-3.5" fill={shot.is_liked ? 'currentColor' : 'none'} />
              </button>
              <button
                title="Save"
                onClick={(e) => e.preventDefault()}
                className="w-8 h-8 rounded-full bg-voxel-white/10 border border-voxel-white/20 flex items-center justify-center text-voxel-white hover:bg-voxel-white/30 transition-all cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer — автор + лайки */}
      <div className="flex justify-between items-center px-3 py-2.5 text-xs text-voxel-gray">
        <Link to={`/profile/${shot.author.username}`} className="flex items-center gap-2 min-w-0">
          <img
            src={shot.author.avatar || `https://ui-avatars.com/api/?name=${shot.author.username}&size=32`}
            alt={shot.author.username}
            className="w-5 h-5 rounded-full object-cover border border-voxel-gray-dark flex-shrink-0"
          />
          <span className="font-medium text-voxel-gray hover:text-voxel-white transition-colors truncate">
            {shot.author.username}
          </span>
        </Link>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Heart className="w-3.5 h-3.5" />
          <span>{shot.likes_count}</span>
        </div>
      </div>
    </div>
  )
}
```

### `src/components/ui/ShotsGrid.tsx`

```typescript
import { ShotCard } from './ShotCard'
import { Shot } from '../../types/shot'

interface ShotsGridProps {
  shots: Shot[]
}

export const ShotsGrid = ({ shots }: ShotsGridProps) => {
  if (shots.length === 0) return null
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {shots.map((shot) => (
        <ShotCard key={shot.id} shot={shot} />
      ))}
    </div>
  )
}
```

### `src/components/ui/ShotsSkeleton.tsx`

```typescript
export const ShotsSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-2xl overflow-hidden border border-gray-100">
        <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
        <div className="px-3 py-2.5 flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-3 bg-gray-200 animate-pulse rounded flex-1" />
        </div>
      </div>
    ))}
  </div>
)
```

---

## 9. FeedPage (`src/pages/FeedPage.tsx`)

```typescript
import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { useFeedQuery } from '../hooks/useShots'
import { ShotsGrid } from '../components/ui/ShotsGrid'
import { ShotsSkeleton } from '../components/ui/ShotsSkeleton'

const POPULAR_TAGS = ['All', 'Mobile', 'Web', 'Dashboard', 'Illustration', 'Branding', 'Glassmorphism']

export const FeedPage = () => {
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('All')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  const filters = {
    search: debouncedSearch || undefined,
    tags: selectedTag !== 'All' ? selectedTag.toLowerCase() : undefined,
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useFeedQuery(filters)

  // Intersection Observer для infinite scroll
  const observerTarget = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!observerTarget.current || !hasNextPage) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage() },
      { threshold: 0.5 }
    )
    observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [observerTarget.current, hasNextPage, isFetchingNextPage])

  const shots = data?.pages.flatMap((p) => p.results) || []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        {/* Tags */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer border ${
                selectedTag === tag
                  ? 'bg-voxel-teal border-voxel-teal text-voxel-black'
                  : 'bg-voxel-white/5 border-voxel-gray-dark text-voxel-gray hover:bg-voxel-white/10 hover:text-voxel-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-voxel-gray" />
          <input
            id="feed-search"
            type="text"
            placeholder="Search designs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-voxel-gray-dark bg-voxel-white/5 pl-9 pr-4 py-2 text-sm text-voxel-white placeholder:text-voxel-gray focus:outline-none focus:border-voxel-teal focus:ring-1 focus:ring-voxel-teal transition-all"
          />
        </div>
      </div>

      {/* States */}
      {isLoading && <ShotsSkeleton count={12} />}
      {isError && <p className="text-center py-12 text-voxel-red font-medium">Не вдалося завантажити стрічку.</p>}
      {!isLoading && !isError && shots.length === 0 && (
        <p className="text-center py-24 text-gray-400">Нічого не знайдено.</p>
      )}

      {/* Grid */}
      <ShotsGrid shots={shots} />

      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="h-16 flex items-center justify-center mt-6">
        {isFetchingNextPage && <span className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />}
      </div>
    </div>
  )
}
```

---

## 10. ProfilePage (`src/pages/ProfilePage.tsx`)

**Відповідно до дизайну Figma — два розділи: Work та Liked**

```typescript
import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { Globe, Twitter, Instagram, Linkedin, Edit } from 'lucide-react'
import { usePublicProfileQuery } from '../hooks/useUsers'
import { useAuthorShotsQuery } from '../hooks/useShots'
import { useAuthStore } from '../store/authStore'
import { ShotsGrid } from '../components/ui/ShotsGrid'
import { ShotsSkeleton } from '../components/ui/ShotsSkeleton'

type ProfileTab = 'work' | 'liked'

export const ProfilePage = () => {
  const { username } = useParams<{ username: string }>()
  const currentUser = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState<ProfileTab>('work')

  // Публічний профіль
  const { data: profile, isLoading: profileLoading } = usePublicProfileQuery(username)

  // Shots автора
  const { data: shotsData, isLoading: shotsLoading } = useAuthorShotsQuery(profile?.id)
  const shots = shotsData?.pages.flatMap((p) => p.results) || []

  const isOwnProfile = currentUser?.username === username

  if (profileLoading) {
    return <div className="flex items-center justify-center py-24"><span className="w-10 h-10 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" /></div>
  }

  if (!profile) {
    return <div className="text-center py-24 text-gray-500">Профіль не знайдено.</div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">

      {/* Profile Header */}
      <div className="flex flex-col items-center text-center mb-10">
        <img
          src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.username}&size=128`}
          alt={profile.username}
          className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg mb-4"
        />
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{profile.username}</h1>
        {profile.bio && <p className="text-gray-500 text-sm max-w-md mb-4">{profile.bio}</p>}

        {/* Social Links */}
        <div className="flex items-center gap-3 mb-6">
          {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors"><Globe className="w-5 h-5" /></a>}
          {profile.twitter && <a href={profile.twitter} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors"><Twitter className="w-5 h-5" /></a>}
          {profile.instagram && <a href={profile.instagram} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors"><Instagram className="w-5 h-5" /></a>}
          {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors"><Linkedin className="w-5 h-5" /></a>}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 text-sm mb-6">
          <div className="text-center">
            <div className="font-bold text-gray-900 text-xl">{profile.shots_count}</div>
            <div className="text-gray-400">Shots</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900 text-xl">{profile.followers_count}</div>
            <div className="text-gray-400">Followers</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900 text-xl">{profile.following_count}</div>
            <div className="text-gray-400">Following</div>
          </div>
        </div>

        {/* CTA */}
        {isOwnProfile ? (
          <Link to="/settings" className="flex items-center gap-2 px-5 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Edit className="w-4 h-4" /> Edit Profile
          </Link>
        ) : (
          <button className="px-6 py-2 rounded-full bg-pink-600 text-white text-sm font-semibold hover:bg-pink-700 transition-colors cursor-pointer">
            {profile.is_following ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-gray-200 mb-8">
        {(['work', 'liked'] as ProfileTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium capitalize transition-colors cursor-pointer ${
              activeTab === tab
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab === 'work' ? 'Work' : 'Liked'}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'work' && (
        <>
          {shotsLoading && <ShotsSkeleton count={6} />}
          {!shotsLoading && shots.length === 0 && <p className="text-center py-16 text-gray-400">Немає опублікованих робіт.</p>}
          <ShotsGrid shots={shots} />
        </>
      )}

      {activeTab === 'liked' && (
        <div className="text-center py-16 text-gray-400">
          Liked shots — буде реалізовано у Фазі 3.
        </div>
      )}
    </div>
  )
}
```

---

## 11. ShotDetailPage (`src/pages/ShotDetailPage.tsx`)

```typescript
import { useParams, Link } from 'react-router'
import { Heart, Bookmark, Trash2, Calendar, ArrowLeft } from 'lucide-react'
import { useShotQuery, useDeleteShotMutation } from '../hooks/useShots'
import { useAuthStore } from '../store/authStore'

export const ShotDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const currentUser = useAuthStore((s) => s.user)
  const { data: shot, isLoading, isError } = useShotQuery(id!)
  const deleteMutation = useDeleteShotMutation()

  if (isLoading) return <div className="flex items-center justify-center py-24"><span className="w-10 h-10 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" /></div>
  if (isError || !shot) return <div className="text-center py-24 text-red-500">Роботу не знайдено.</div>

  const isAuthor = currentUser?.id === shot.author.id

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Back link */}
      <Link to="/feed" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Назад до стрічки
      </Link>

      {/* Title + Author row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{shot.title}</h1>
          <Link to={`/profile/${shot.author.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img
              src={shot.author.avatar || `https://ui-avatars.com/api/?name=${shot.author.username}&size=32`}
              alt={shot.author.username}
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{shot.author.username}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(shot.created_at).toLocaleDateString('uk-UA')}
              </p>
            </div>
          </Link>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer">
            <Heart className="w-4 h-4" /> {shot.likes_count}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer">
            <Bookmark className="w-4 h-4" /> Save
          </button>
          {isAuthor && (
            <button
              onClick={() => { if (confirm('Видалити цю роботу?')) deleteMutation.mutate(shot.id) }}
              disabled={deleteMutation.isPending}
              className="w-10 h-10 rounded-full border border-red-200 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main image */}
      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-lg mb-10">
        <img src={shot.image} alt={shot.title} className="w-full object-contain max-h-[700px] bg-gray-50" />
      </div>

      {/* Description + Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {shot.description && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Опис</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{shot.description}</p>
            </>
          )}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Теги</h2>
          {shot.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {shot.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/feed?tags=${tag}`}
                  className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs rounded-full transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Тегів немає.</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## 12. UploadPage (`src/pages/UploadPage.tsx`)

```typescript
import React, { useState, useRef } from 'react'
import { UploadCloud, X, Plus } from 'lucide-react'
import { useCreateShotMutation } from '../hooks/useShots'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export const UploadPage = () => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const createMutation = useCreateShotMutation()

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }

  const handleAddTag = () => {
    const clean = tagInput.trim().toLowerCase()
    if (clean && !tags.includes(clean)) { setTags([...tags, clean]); setTagInput('') }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !imageFile) return
    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    tags.forEach((tag) => formData.append('tags', tag))
    formData.append('image', imageFile)
    createMutation.mutate(formData)
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Upload your shot</h1>
      <p className="text-gray-400 text-sm text-center mb-10">Share your creative work with the community</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Image drop zone */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Shot image *</label>
          {imagePreview ? (
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(null) }}
                className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all ${dragActive ? 'border-pink-400 bg-pink-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
            >
              <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} accept="image/*" className="hidden" />
              <UploadCloud className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium text-sm">Drag & drop or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP</p>
            </div>
          )}
        </div>

        <Input label="Shot title *" placeholder="Give your shot a creative name..." value={title} onChange={(e) => setTitle(e.target.value)} required />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 tracking-wide">Description</label>
          <textarea
            placeholder="Tell us about your design process..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 min-h-[100px] resize-none"
          />
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tags</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. ui, mobile, branding"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
            />
            <button type="button" onClick={handleAddTag} className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  #{tag}
                  <button type="button" onClick={() => setTags(tags.filter((_, i) => i !== idx))} className="hover:text-red-500 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" isLoading={createMutation.isPending} disabled={!title || !imageFile} size="lg" className="w-full">
          Publish shot
        </Button>
      </form>
    </div>
  )
}
```

---

## 13. Інтеграція з бекендом

- Змінити `.env`: `VITE_USE_MOCKS=false`
- Перевірити що бекенд доступний на `http://localhost:8000`
- CORS на бекенді дозволяє `http://localhost:5173`
