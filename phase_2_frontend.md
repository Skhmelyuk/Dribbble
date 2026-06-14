# Детальний опис Фази 2: Shots та Feed (Фронтенд)

Цей документ містить покрокову інструкцію для розробки фронтенд-частини **Фази 2 (Shots та Feed)** на базі React, TypeScript, Tailwind CSS v4.3, Zustand, TanStack Query v5 та React Router v7.

---

## 1. Встановлення залежностей та налаштування роутингу

1. **Встановлення іконок `lucide-react` (для кнопок завантаження, лайків, пошуку тощо):**
   ```bash
   npm install lucide-react
   ```

2. **Оновлення маршрутів у `src/router.tsx`:**
   Додамо нові сторінки: головну стрічку (Feed), сторінку завантаження роботи (Upload) та детальну сторінку Shot.

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
     if (token) throw redirect('/feed')
     return null
   }

   export const router = createBrowserRouter([
     {
       path: '/',
       loader: () => redirect('/feed'),
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
           path: '/feed',
           lazy: () => import('./pages/FeedPage').then((m) => ({ Component: m.FeedPage })),
         },
         {
           path: '/upload',
           loader: authLoader,
           lazy: () => import('./pages/UploadPage').then((m) => ({ Component: m.UploadPage })),
         },
         {
           path: '/shot/:id',
           lazy: () => import('./pages/ShotDetailPage').then((m) => ({ Component: m.ShotDetailPage })),
         },
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

## 2. Типи даних та запити API

1. **Опис інтерфейсу Shot у `src/types/shot.ts`:**
   ```typescript
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

2. **Запити через клієнт Axios у `src/api/shots.ts`:**
   ```typescript
   import { api } from './index'
   import { Shot, PaginatedResponse } from '../types/shot'

   export interface GetShotsParams {
     limit?: number
     offset?: number
     search?: string
     tags?: string
     author?: number | string
   }

   export const shotsApi = {
     getShots: (params: GetShotsParams) => 
       api.get<PaginatedResponse<Shot>>('/shots/', { params }),
       
     getShot: (id: string | number) => 
       api.get<Shot>(`/shots/${id}/`),
       
     createShot: (formData: FormData) => 
       api.post<Shot>('/shots/', formData, {
         headers: {
           'Content-Type': 'multipart/form-data',
         },
       }),
       
     updateShot: (id: string | number, data: Partial<Pick<Shot, 'title' | 'description'>>) => 
       api.patch<Shot>(`/shots/${id}/`, data),
       
     deleteShot: (id: string | number) => 
       api.delete(`/shots/${id}/`),
   }
   ```

---

## 3. TanStack Query Хуки (`src/hooks/useShots.ts`)

Створюємо хуки для кешування та підтримки нескінченної прокрутки (Infinite Scroll) у стрічці робіт.

```typescript
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shotsApi, GetShotsParams } from '../api/shots'
import { useNavigate } from 'react-router'

// Нескінченна прокрутка з автовизначенням offset з лінків DRF
export const useFeedQuery = (filters: Omit<GetShotsParams, 'limit' | 'offset'>) => {
  return useInfiniteQuery({
    queryKey: ['feed', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await shotsApi.getShots({
        offset: pageParam as number,
        limit: 12,
        ...filters,
      })
      return response.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined
      try {
        const url = new URL(lastPage.next)
        const offset = url.searchParams.get('offset')
        return offset ? parseInt(offset, 10) : undefined
      } catch {
        return undefined
      }
    },
  })
}

// Отримання детальної інформації про роботу
export const useShotQuery = (id: string | number) => {
  return useQuery({
    queryKey: ['shot', id],
    queryFn: async () => {
      const response = await shotsApi.getShot(id)
      return response.data
    },
    enabled: !!id,
  })
}

// Створення нової роботи
export const useCreateShotMutation = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: shotsApi.createShot,
    onSuccess: (data) => {
      // Скидаємо стрічку, щоб нова робота з'явилась зверху
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      navigate(`/shot/${data.id}`)
    },
  })
}

// Видалення роботи
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

## 4. Налаштування MSW Моків для Shots API (`src/mocks/handlers/shots.ts`)

Для повноцінної автономної розробки реалізуємо MSW хендлери, які зберігають завантажені роботи в локальній memory-базі та підтримують пагінацію, фільтрацію і пошук.

```typescript
import { http, HttpResponse } from 'msw'
import { Shot } from '../../types/shot'

const BASE_URL = 'http://localhost:8000/api'

// Створюємо початкові мокові дані
let mockShots: Shot[] = [
  {
    id: 101,
    title: 'Minimalist Task Manager App',
    description: 'Clean UI concept for a mobile productivity app featuring dark mode, glassmorphism card layout, and smooth micro-animations.',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    preview: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=300&q=80',
    tags: ['mobile', 'productivity', 'glassmorphism'],
    author: {
      id: 1,
      username: 'kyiv_creator',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'
    },
    likes_count: 42,
    comments_count: 5,
    is_liked: false,
    is_saved: false,
    created_at: '2026-06-12T14:20:00Z'
  },
  {
    id: 102,
    title: 'E-Commerce Dashboard analytics',
    description: 'Web responsive SaaS tool dashboard displaying metrics, charts and conversion paths. Optimized with custom Tailwind themes.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    preview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&h=300&q=80',
    tags: ['web', 'dashboard', 'saas'],
    author: {
      id: 2,
      username: 'lviv_designer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80'
    },
    likes_count: 108,
    comments_count: 12,
    is_liked: false,
    is_saved: false,
    created_at: '2026-06-10T09:15:00Z'
  }
]

export const shotsHandlers = [
  // GET Список Shots (з фільтрацією, пошуком та пагінацією)
  http.get(`${BASE_URL}/shots/`, ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '12', 10)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)
    const search = url.searchParams.get('search')?.toLowerCase()
    const tagsParam = url.searchParams.get('tags')
    const authorParam = url.searchParams.get('author')

    let filtered = [...mockShots]

    // Фільтрація за автором
    if (authorParam) {
      filtered = filtered.filter(s => s.author.id.toString() === authorParam)
    }

    // Фільтрація за пошуком (title & description)
    if (search) {
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(search) || 
        s.description.toLowerCase().includes(search)
      )
    }

    // Фільтрація за тегами (усі теги мають збігатися)
    if (tagsParam) {
      const tagsList = tagsParam.split(',').map(t => t.trim().toLowerCase())
      filtered = filtered.filter(s => 
        tagsList.every(tag => s.tags.includes(tag))
      )
    }

    // Пагінація
    const sliced = filtered.slice(offset, offset + limit)
    const nextOffset = offset + limit
    const hasNext = nextOffset < filtered.length
    
    const nextUrl = hasNext 
      ? `${BASE_URL}/shots/?limit=${limit}&offset=${nextOffset}${search ? `&search=${search}` : ''}${tagsParam ? `&tags=${tagsParam}` : ''}`
      : null

    const previousUrl = offset > 0
      ? `${BASE_URL}/shots/?limit=${limit}&offset=${Math.max(0, offset - limit)}`
      : null

    return HttpResponse.json({
      count: filtered.length,
      next: nextUrl,
      previous: previousUrl,
      results: sliced
    }, { status: 200 })
  }),

  // GET Детальний Shot за ID
  http.get(`${BASE_URL}/shots/:id/`, ({ params }) => {
    const id = parseInt(params.id as string, 10)
    const shot = mockShots.find(s => s.id === id)
    if (!shot) {
      return HttpResponse.json({ detail: 'Роботу не знайдено.' }, { status: 404 })
    }
    return HttpResponse.json(shot, { status: 200 })
  }),

  // POST Створення Shot (multipart/form-data)
  http.post(`${BASE_URL}/shots/`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Улікові дані не надано.' }, { status: 401 })
    }

    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = (formData.get('description') as string) || ''
    const tagsRaw = (formData.get('tags') as string) || ''
    const imageFile = formData.get('image') as File

    if (!title || !imageFile) {
      return HttpResponse.json({ detail: 'Назва та файл зображення обовʼязкові.' }, { status: 400 })
    }

    const tagsList = tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    const imageObjectURL = URL.createObjectURL(imageFile)

    const newShot: Shot = {
      id: Math.floor(Math.random() * 10000) + 200,
      title,
      description,
      image: imageObjectURL,
      preview: imageObjectURL, // спрощено для моку
      tags: tagsList,
      author: {
        id: 1, // Поточний mockUser з authHandler
        username: 'kyiv_creator',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'
      },
      likes_count: 0,
      comments_count: 0,
      is_liked: false,
      is_saved: false,
      created_at: new Date().toISOString()
    }

    // Вставляємо на початок
    mockShots.unshift(newShot)
    return HttpResponse.json(newShot, { status: 201 })
  }),

  // DELETE Видалення Shot
  http.delete(`${BASE_URL}/shots/:id/`, ({ params }) => {
    const id = parseInt(params.id as string, 10)
    const index = mockShots.findIndex(s => s.id === id)
    if (index === -1) {
      return HttpResponse.json({ detail: 'Роботу не знайдено.' }, { status: 404 })
    }
    mockShots.splice(index, 1)
    return new Response(null, { status: 204 })
  })
]
```

**Оновлення `src/mocks/browser.ts`:**
```typescript
import { setupWorker } from 'msw/browser'
import { authHandlers } from './handlers/auth'
import { shotsHandlers } from './handlers/shots' // Імпортуємо новий хендлер

export const worker = setupWorker(...authHandlers, ...shotsHandlers)
```

---

## 5. Компонент `ShotCard` (`src/components/ui/ShotCard.tsx`)

Картка для стрічки з красивим наведенням (hover overlay), плавними переходами за допомогою CSS та інформацією про автора.

```typescript
import { Link } from 'react-router'
import { Heart, Bookmark } from 'lucide-react'
import { Shot } from '../../types/shot'

interface ShotCardProps {
  shot: Shot
}

export const ShotCard = ({ shot }: ShotCardProps) => {
  return (
    <div className="group relative flex flex-col gap-2 bg-surface-alt border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:translate-y-[-2px]">
      
      {/* Контейнер Зображення та Overlay */}
      <div className="relative aspect-[4/3] bg-surface overflow-hidden">
        <img
          src={shot.preview || shot.image}
          alt={shot.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="flex justify-between items-center text-white">
            <Link to={`/shot/${shot.id}`} className="font-semibold truncate max-w-[70%] hover:underline">
              {shot.title}
            </Link>
            <div className="flex gap-2">
              <button 
                title="Like"
                className="w-8 h-8 rounded-full bg-surface-alt/80 border border-border/50 flex items-center justify-center text-muted hover:text-primary hover:bg-white transition-all cursor-pointer"
              >
                <Heart className="w-4 h-4" />
              </button>
              <button 
                title="Save"
                className="w-8 h-8 rounded-full bg-surface-alt/80 border border-border/50 flex items-center justify-center text-muted hover:text-white hover:bg-white/20 transition-all cursor-pointer"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Інформація про автора внизу картки */}
      <div className="flex justify-between items-center px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <img
            src={shot.author.avatar || 'https://via.placeholder.com/50'}
            alt={shot.author.username}
            className="w-5 h-5 rounded-full object-cover border border-border"
          />
          <span className="font-medium text-white hover:text-primary transition-colors truncate max-w-[100px]">
            {shot.author.username}
          </span>
        </div>
        <div className="flex items-center gap-3 text-muted">
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            {shot.likes_count}
          </span>
        </div>
      </div>
    </div>
  )
}
```

---

## 6. Сторінка Стрічки робіт (`src/pages/FeedPage.tsx`)

Стрічка підтримує пошук у реальному часі, фільтрацію за тегами через клієнтські баджі, сітку (Grid) та нескінченне завантаження через `IntersectionObserver` без додаткових бібліотек.

```typescript
import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { useFeedQuery } from '../hooks/useShots'
import { ShotCard } from '../components/ui/ShotCard'
import { Input } from '../components/ui/Input'

const POPULAR_TAGS = ['all', 'mobile', 'web', 'dashboard', 'productivity', 'glassmorphism', 'saas']

export const FeedPage = () => {
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('all')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Затримка пошуку (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  const filters = {
    search: debouncedSearch || undefined,
    tags: selectedTag !== 'all' ? selectedTag : undefined
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useFeedQuery(filters)

  // Налаштування Intersection Observer для нескінченної прокрутки
  const observerTarget = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!observerTarget.current || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 1.0 }
    )

    observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [observerTarget.current, hasNextPage, isFetchingNextPage])

  const shots = data?.pages.flatMap((page) => page.results) || []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Рядок фільтрації та пошуку */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        {/* Теги */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-primary text-white'
                  : 'bg-surface-alt border border-border text-muted hover:text-white hover:border-gray-500'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Рядок пошуку */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Пошук робіт..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full bg-surface-alt border border-border pl-10 pr-4 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Стан завантаження */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-2xl bg-surface-alt animate-pulse border border-border" />
          ))}
        </div>
      )}

      {/* Помилка */}
      {isError && (
        <div className="text-center py-12 text-red-500 font-semibold">
          Не вдалося завантажити стрічку робіт. Будь ласка, спробуйте пізніше.
        </div>
      )}

      {/* Результати */}
      {!isLoading && !isError && shots.length === 0 && (
        <div className="text-center py-24 text-muted">
          Робіт не знайдено за вашим запитом.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {shots.map((shot) => (
          <ShotCard key={shot.id} shot={shot} />
        ))}
      </div>

      {/* Елемент-тригер для завантаження наступної сторінки */}
      <div ref={observerTarget} className="h-10 mt-8 flex justify-center items-center">
        {isFetchingNextPage && (
          <span className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        )}
      </div>
    </div>
  )
}
```

---

## 7. Сторінка публікації роботи (`src/pages/UploadPage.tsx`)

Сторінка з Drag & Drop інтерфейсом для вибору файлу, баджами тегів, які можна додавати через Enter, та індикатором завантаження.

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

  // Обробка файлів
  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  // Робота з тегами
  const handleAddTag = () => {
    const cleanTag = tagInput.trim().toLowerCase()
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !imageFile) return

    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('tags', tags.join(','))
    formData.append('image', imageFile)

    createMutation.mutate(formData)
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-surface-alt border border-border rounded-3xl p-8 shadow-xl">
        <h1 className="text-3xl font-extrabold text-white mb-2 text-center">Завантажити нову роботу</h1>
        <p className="text-muted text-sm text-center mb-8">Поділіться своїми креативними ідеями зі спільнотою</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* Зона завантаження зображення */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted tracking-wider uppercase">Зображення роботи</label>
            
            {imagePreview ? (
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                  }}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 cursor-pointer transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-surface hover:bg-surface-alt'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleChange}
                  accept="image/*"
                  className="hidden"
                />
                <UploadCloud className="w-12 h-12 text-muted mb-4 group-hover:text-white" />
                <p className="text-white font-medium text-sm mb-1">Перетягніть файл сюди або натисніть для вибору</p>
                <p className="text-xs text-muted">Підтримуються формати JPG, PNG, GIF</p>
              </div>
            )}
          </div>

          <Input
            label="Назва роботи"
            placeholder="Введіть креативну назву..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted tracking-wide">Опис роботи</label>
            <textarea
              placeholder="Розкажіть трохи про вашу роботу, деталі концепту..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl bg-surface border border-border px-4 py-3 text-sm text-white focus:outline-none focus:border-primary min-h-[100px]"
            />
          </div>

          {/* Додавання тегів */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted tracking-wider uppercase">Теги</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="наприклад: ui, app, branding"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                className="flex-1 rounded-2xl bg-surface border border-border px-4 py-3 text-sm text-white focus:outline-none focus:border-primary"
              />
              <Button type="button" onClick={handleAddTag} variant="secondary">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Відображення баджів */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, idx) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface border border-border text-xs text-white rounded-full"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Button
            type="submit"
            isLoading={createMutation.isPending}
            disabled={!title || !imageFile}
            className="w-full mt-4"
          >
            Опублікувати
          </Button>

        </form>
      </div>
    </div>
  )
}
```

---

## 8. Детальна сторінка Shot (`src/pages/ShotDetailPage.tsx`)

Детальний перегляд роботи з великим красивим медіа-контейнером, інформацією про автора та можливістю видалення роботи автором.

```typescript
import { useParams, Link } from 'react-router'
import { Heart, Bookmark, Trash2, Calendar } from 'lucide-react'
import { useShotQuery, useDeleteShotMutation } from '../hooks/useShots'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'

export const ShotDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const currentUser = useAuthStore((s) => s.user)
  
  const { data: shot, isLoading, isError } = useShotQuery(id!)
  const deleteMutation = useDeleteShotMutation()

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !shot) {
    return (
      <div className="text-center py-24 text-red-500 font-semibold">
        Роботу не знайдено або сталася помилка завантаження.
      </div>
    )
  }

  const isAuthor = currentUser?.id === shot.author.id

  const handleDelete = () => {
    if (confirm('Ви впевнені, що хочете видалити цей Shot?')) {
      deleteMutation.mutate(shot.id)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      
      {/* Кнопка повернення */}
      <Link to="/feed" className="text-sm text-muted hover:text-white transition-colors mb-6 inline-block">
        &larr; Назад до стрічки
      </Link>

      {/* Заголовок та Автор */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2">{shot.title}</h1>
          <div className="flex items-center gap-3">
            <img
              src={shot.author.avatar || 'https://via.placeholder.com/50'}
              alt={shot.author.username}
              className="w-8 h-8 rounded-full object-cover border border-border"
            />
            <div>
              <p className="text-sm font-medium text-white">{shot.author.username}</p>
              <p className="text-xs text-muted flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(shot.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Кнопки Дій */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="secondary" className="flex-1 md:flex-initial">
            <Heart className="w-4 h-4 mr-2" />
            Лайк
          </Button>
          <Button variant="secondary" className="flex-1 md:flex-initial">
            <Bookmark className="w-4 h-4 mr-2" />
            Зберегти
          </Button>
          
          {isAuthor && (
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="w-10 h-10 rounded-full border border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
              title="Видалити Shot"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Головне Зображення */}
      <div className="rounded-3xl overflow-hidden border border-border shadow-2xl bg-surface-alt mb-8">
        <img
          src={shot.image}
          alt={shot.title}
          className="w-full max-h-[700px] object-contain mx-auto"
        />
      </div>

      {/* Опис та Теги */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Опис</h3>
            <p className="text-muted leading-relaxed text-sm whitespace-pre-line">
              {shot.description || 'Опис відсутній.'}
            </p>
          </div>
        </div>

        {/* Теги у правого стовпчика */}
        <div className="bg-surface-alt border border-border rounded-2xl p-6 h-fit">
          <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Теги роботи</h3>
          {shot.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {shot.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/feed?tags=${tag}`}
                  className="px-3 py-1 bg-surface hover:bg-border text-xs text-muted hover:text-white rounded-full transition-all border border-border"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted">Тегів немає.</p>
          )}
        </div>
      </div>

    </div>
  )
}
```
