# Фаза 3: Соціальні Взаємодії (Фронтенд)

> Стек: React + TypeScript + TanStack Query v5 + Zustand  
> Передумова: Фаза 2 повністю реалізована. Всі заглушки у `ShotCard`, `ShotDetailPage`, `ProfilePage` підготовлені.

---

## Що реалізується у цій фазі

| Функціонал | Сторінка |
|---|---|
| Like / Unlike shot | `ShotCard` (hover), `ShotDetailPage` |
| Save shot | `ShotCard` (hover), `ShotDetailPage` |
| Follow / Unfollow user | `ProfilePage` |
| Comments — перегляд | `ShotDetailPage` |
| Comments — додавання та видалення | `ShotDetailPage` |
| Liked shots tab | `ProfilePage` → вкладка "Liked" |
| Followers / Following | `ProfilePage` (модальне вікно) |

---

## 1. Нові типи (`src/types/social.ts`)

```typescript
export interface Comment {
  id: number
  author: {
    id: number
    username: string
    avatar: string | null
  }
  text: string
  created_at: string
}

export interface FollowUser {
  id: number
  username: string
  avatar: string | null
  bio: string
}
```

---

## 2. API функції (`src/api/social.ts`)

```typescript
import { api } from './index'
import { Comment, FollowUser } from '../types/social'
import { PaginatedResponse } from '../types/shot'

export const socialApi = {
  // ─── Like ────────────────────────────────────────
  toggleLike: (shotId: number) =>
    api.post<{ liked: boolean; likes_count: number }>(`/shots/${shotId}/like/`),

  // ─── Save ────────────────────────────────────────
  toggleSave: (shotId: number) =>
    api.post<{ saved: boolean }>(`/shots/${shotId}/save/`),

  // ─── Comments ────────────────────────────────────
  getComments: (shotId: number) =>
    api.get<Comment[]>(`/shots/${shotId}/comments/`),

  addComment: (shotId: number, text: string) =>
    api.post<Comment>(`/shots/${shotId}/comments/`, { text }),

  deleteComment: (shotId: number, commentId: number) =>
    api.delete(`/shots/${shotId}/comments/${commentId}/`),

  // ─── Follow ──────────────────────────────────────
  toggleFollow: (username: string) =>
    api.post<{ following: boolean; followers_count: number }>(`/users/${username}/follow/`),

  // ─── Liked shots ─────────────────────────────────
  getLikedShots: (username: string, params?: { limit?: number; offset?: number }) =>
    api.get<PaginatedResponse<import('../types/shot').Shot>>(`/users/${username}/liked/`, { params }),

  // ─── Followers / Following ────────────────────────
  getFollowers: (username: string) =>
    api.get<FollowUser[]>(`/users/${username}/followers/`),

  getFollowing: (username: string) =>
    api.get<FollowUser[]>(`/users/${username}/following/`),
}
```

---

## 3. TanStack Query хуки (`src/hooks/useSocial.ts`)

```typescript
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { socialApi } from '../api/social'

// ─── Like ─────────────────────────────────────────────────────
export const useLikeMutation = (shotId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => socialApi.toggleLike(shotId),
    onSuccess: () => {
      // Оновлюємо кеш: деталі shot та стрічку
      queryClient.invalidateQueries({ queryKey: ['shot', shotId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['authorShots'] })
    },
  })
}

// ─── Save ─────────────────────────────────────────────────────
export const useSaveMutation = (shotId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => socialApi.toggleSave(shotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shot', shotId] })
    },
  })
}

// ─── Comments ─────────────────────────────────────────────────
export const useCommentsQuery = (shotId: number) => {
  return useQuery({
    queryKey: ['comments', shotId],
    queryFn: async () => (await socialApi.getComments(shotId)).data,
    enabled: !!shotId,
  })
}

export const useAddCommentMutation = (shotId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (text: string) => socialApi.addComment(shotId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', shotId] })
      queryClient.invalidateQueries({ queryKey: ['shot', shotId] }) // оновити comments_count
    },
  })
}

export const useDeleteCommentMutation = (shotId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) => socialApi.deleteComment(shotId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', shotId] })
    },
  })
}

// ─── Follow ───────────────────────────────────────────────────
export const useFollowMutation = (username: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => socialApi.toggleFollow(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicProfile', username] })
    },
  })
}

// ─── Liked shots ──────────────────────────────────────────────
export const useLikedShotsQuery = (username: string | undefined) => {
  return useInfiniteQuery({
    queryKey: ['likedShots', username],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await socialApi.getLikedShots(username!, { offset: pageParam as number, limit: 12 })
      return response.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined
      try { return parseInt(new URL(lastPage.next).searchParams.get('offset') || '0', 10) }
      catch { return undefined }
    },
    enabled: !!username,
  })
}

// ─── Followers / Following ────────────────────────────────────
export const useFollowersQuery = (username: string | undefined) => {
  return useQuery({
    queryKey: ['followers', username],
    queryFn: async () => (await socialApi.getFollowers(username!)).data,
    enabled: !!username,
  })
}

export const useFollowingQuery = (username: string | undefined) => {
  return useQuery({
    queryKey: ['following', username],
    queryFn: async () => (await socialApi.getFollowing(username!)).data,
    enabled: !!username,
  })
}
```

---

## 4. MSW Handlers (`src/mocks/handlers/social.ts`)

```typescript
import { http, HttpResponse } from 'msw'
import { Comment, FollowUser } from '../../types/social'

const BASE_URL = 'http://localhost:8000/api'

// ─── Стан мока ─────────────────────────────────────────────────
const likedShotIds = new Set<number>()
const savedShotIds = new Set<number>()
const likesCount: Record<number, number> = { 101: 42, 102: 108, 103: 67 }
const followedUsers = new Set<string>()

let mockComments: Comment[] = [
  {
    id: 1,
    author: { id: 2, username: 'lviv_designer', avatar: null },
    text: 'Чудова робота! Дуже люблю мінімалізм.',
    created_at: '2026-06-12T15:00:00Z'
  },
  {
    id: 2,
    author: { id: 3, username: 'odesa_creative', avatar: null },
    text: 'Ця кольорова палітра просто бездоганна 🔥',
    created_at: '2026-06-12T16:30:00Z'
  },
]

const mockFollowers: FollowUser[] = [
  { id: 2, username: 'lviv_designer', avatar: null, bio: 'UI/UX Designer from Lviv' },
  { id: 3, username: 'odesa_creative', avatar: null, bio: 'Creative director' },
]

export const socialHandlers = [
  // ─── Like toggle ─────────────────────────────────────────────
  http.post(`${BASE_URL}/shots/:id/like/`, ({ params }) => {
    const shotId = parseInt(params.id as string, 10)
    if (likedShotIds.has(shotId)) {
      likedShotIds.delete(shotId)
      likesCount[shotId] = (likesCount[shotId] || 1) - 1
      return HttpResponse.json({ liked: false, likes_count: likesCount[shotId] })
    }
    likedShotIds.add(shotId)
    likesCount[shotId] = (likesCount[shotId] || 0) + 1
    return HttpResponse.json({ liked: true, likes_count: likesCount[shotId] }, { status: 201 })
  }),

  // ─── Save toggle ─────────────────────────────────────────────
  http.post(`${BASE_URL}/shots/:id/save/`, ({ params }) => {
    const shotId = parseInt(params.id as string, 10)
    if (savedShotIds.has(shotId)) {
      savedShotIds.delete(shotId)
      return HttpResponse.json({ saved: false })
    }
    savedShotIds.add(shotId)
    return HttpResponse.json({ saved: true }, { status: 201 })
  }),

  // ─── Comments GET ─────────────────────────────────────────────
  http.get(`${BASE_URL}/shots/:id/comments/`, () => {
    return HttpResponse.json(mockComments)
  }),

  // ─── Comments POST ────────────────────────────────────────────
  http.post(`${BASE_URL}/shots/:id/comments/`, async ({ request }) => {
    const body = (await request.json()) as { text: string }
    if (!body.text?.trim()) return HttpResponse.json({ detail: 'text обов\'язковий.' }, { status: 400 })
    const newComment: Comment = {
      id: Date.now(),
      author: { id: 1, username: 'kyiv_creator', avatar: null },
      text: body.text.trim(),
      created_at: new Date().toISOString()
    }
    mockComments.push(newComment)
    return HttpResponse.json(newComment, { status: 201 })
  }),

  // ─── Comments DELETE ──────────────────────────────────────────
  http.delete(`${BASE_URL}/shots/:id/comments/:commentId/`, ({ params }) => {
    const commentId = parseInt(params.commentId as string, 10)
    const idx = mockComments.findIndex(c => c.id === commentId)
    if (idx === -1) return HttpResponse.json({ detail: 'Не знайдено.' }, { status: 404 })
    mockComments.splice(idx, 1)
    return new Response(null, { status: 204 })
  }),

  // ─── Follow toggle ────────────────────────────────────────────
  http.post(`${BASE_URL}/users/:username/follow/`, ({ params }) => {
    const username = params.username as string
    if (followedUsers.has(username)) {
      followedUsers.delete(username)
      return HttpResponse.json({ following: false, followers_count: 1 })
    }
    followedUsers.add(username)
    return HttpResponse.json({ following: true, followers_count: 2 }, { status: 201 })
  }),

  // ─── Liked shots ──────────────────────────────────────────────
  http.get(`${BASE_URL}/users/:username/liked/`, () => {
    return HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
  }),

  // ─── Followers ────────────────────────────────────────────────
  http.get(`${BASE_URL}/users/:username/followers/`, () => {
    return HttpResponse.json(mockFollowers)
  }),

  // ─── Following ───────────────────────────────────────────────
  http.get(`${BASE_URL}/users/:username/following/`, () => {
    return HttpResponse.json(mockFollowers.slice(0, 1))
  }),
]
```

Оновити `src/mocks/browser.ts`:
```typescript
import { setupWorker } from 'msw/browser'
import { authHandlers } from './handlers/auth'
import { shotsHandlers } from './handlers/shots'
import { socialHandlers } from './handlers/social'

export const worker = setupWorker(...authHandlers, ...shotsHandlers, ...socialHandlers)
```

---

## 5. Компонент `CommentsSection` (`src/components/shot/CommentsSection.tsx`)

```typescript
import { useState } from 'react'
import { Trash2, Send } from 'lucide-react'
import { useCommentsQuery, useAddCommentMutation, useDeleteCommentMutation } from '../../hooks/useSocial'
import { useAuthStore } from '../../store/authStore'

interface CommentsSectionProps {
  shotId: number
}

export const CommentsSection = ({ shotId }: CommentsSectionProps) => {
  const [text, setText] = useState('')
  const currentUser = useAuthStore((s) => s.user)

  const { data: comments = [], isLoading } = useCommentsQuery(shotId)
  const addMutation = useAddCommentMutation(shotId)
  const deleteMutation = useDeleteCommentMutation(shotId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    addMutation.mutate(text.trim(), { onSuccess: () => setText('') })
  }

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Коментарі {comments.length > 0 && <span className="text-gray-400 font-normal">({comments.length})</span>}
      </h2>

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-voxel-white/10 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-voxel-white/10 rounded w-24" />
                <div className="h-3 bg-voxel-white/10 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5 mb-8">
          {comments.length === 0 && (
            <p className="text-voxel-gray text-sm">Поки що немає коментарів. Будьте першим!</p>
          )}
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <img
                src={comment.author.avatar || `https://ui-avatars.com/api/?name=${comment.author.username}&size=32`}
                alt={comment.author.username}
                className="w-8 h-8 rounded-full object-cover border border-voxel-gray-dark flex-shrink-0"
              />
              <div className="flex-1 bg-voxel-white/5 border border-voxel-gray-dark rounded-2xl px-4 py-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-medium text-voxel-white text-sm">{comment.author.username}</span>
                  <span className="text-xs text-voxel-gray whitespace-nowrap">
                    {new Date(comment.created_at).toLocaleDateString('uk-UA')}
                  </span>
                </div>
                <p className="text-sm text-voxel-gray mt-1 leading-relaxed">{comment.text}</p>
              </div>
              {/* Видалення — тільки свого коментаря */}
              {currentUser?.id === comment.author.id && (
                <button
                  onClick={() => deleteMutation.mutate(comment.id)}
                  disabled={deleteMutation.isPending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-voxel-gray hover:text-voxel-red flex-shrink-0 self-start mt-2 cursor-pointer"
                  title="Видалити коментар"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add comment form — тільки авторизованим */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <img
            src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.username}&size=32`}
            alt={currentUser.username}
            className="w-8 h-8 rounded-full object-cover border border-voxel-gray-dark flex-shrink-0"
          />
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Напишіть коментар..."
              rows={1}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any) } }}
              className="w-full rounded-2xl border border-voxel-gray-dark bg-voxel-white/5 px-4 py-3 pr-12 text-sm text-voxel-white placeholder:text-voxel-gray resize-none focus:outline-none focus:border-voxel-teal focus:ring-1 focus:ring-voxel-teal transition-all"
            />
            <button
              type="submit"
              disabled={!text.trim() || addMutation.isPending}
              className="absolute right-3 bottom-3 text-voxel-gray hover:text-voxel-teal disabled:opacity-30 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-voxel-gray">
          <a href="/login" className="text-voxel-teal font-medium hover:underline">Увійдіть</a>, щоб залишити коментар.
        </p>
      )}
    </div>
  )
}
```

---

## 6. Оновлення `ShotDetailPage` — підключити взаємодії

```typescript
// Додати у ShotDetailPage.tsx:
import { useLikeMutation, useSaveMutation } from '../hooks/useSocial'
import { CommentsSection } from '../components/shot/CommentsSection'

// Всередині компонента:
const likeMutation = useLikeMutation(shot.id)
const saveMutation = useSaveMutation(shot.id)

// Кнопка Like (замінити заглушку):
<button
  id={`like-shot-${shot.id}`}
  onClick={() => likeMutation.mutate()}
  disabled={likeMutation.isPending || !currentUser}
  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all cursor-pointer disabled:opacity-50 ${
    shot.is_liked
      ? 'border-[var(--color-voxel-red)] bg-[var(--color-voxel-red)] text-white'
      : 'border-[var(--color-voxel-gray-dark)] text-white hover:bg-white/10'
  }`}
>
  <Heart className="w-4 h-4" fill={shot.is_liked ? 'currentColor' : 'none'} />
  {shot.likes_count}
</button>

// Кнопка Save (замінити заглушку):
<button
  id={`save-shot-${shot.id}`}
  onClick={() => saveMutation.mutate()}
  disabled={saveMutation.isPending || !currentUser}
  className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-voxel-gray-dark)] text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 text-white"
>
  <Bookmark className="w-4 h-4" fill={shot.is_saved ? 'currentColor' : 'none'} />
  Save
</button>

// Додати секцію коментарів внизу сторінки (після Tags):
<CommentsSection shotId={shot.id} />
```

---

## 7. Оновлення `ShotCard` — активний like

```typescript
// Додати у ShotCard.tsx:
import { useLikeMutation } from '../../hooks/useSocial'

// Замінити onClick заглушку на кнопці Like:
const likeMutation = useLikeMutation(shot.id)

// кнопка:
onClick={(e) => {
  e.preventDefault()
  e.stopPropagation()
  likeMutation.mutate()
}}
```

---

## 8. Оновлення `ProfilePage` — Follow + Liked tab

```typescript
// Додати у ProfilePage.tsx:
import { useFollowMutation, useLikedShotsQuery } from '../hooks/useSocial'

// Кнопка Follow (замінити заглушку):
const followMutation = useFollowMutation(profile.username)

<button
  id={`follow-${profile.username}`}
  onClick={() => followMutation.mutate()}
  disabled={followMutation.isPending}
  className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 ${
    profile.is_following
      ? 'border border-voxel-gray-dark text-voxel-white hover:border-voxel-red hover:text-voxel-red hover:bg-voxel-red/5'
      : 'bg-voxel-teal text-voxel-black hover:bg-voxel-cyan hover:shadow-lg hover:shadow-voxel-teal/20'
  }`}
>
  {followMutation.isPending ? '...' : profile.is_following ? 'Following' : 'Follow'}
</button>

// Вкладка Liked — замінити заглушку:
const { data: likedData, isLoading: likedLoading } = useLikedShotsQuery(
  activeTab === 'liked' ? username : undefined
)
const likedShots = likedData?.pages.flatMap((p) => p.results) || []

// JSX:
{activeTab === 'liked' && (
  <>
    {likedLoading && <ShotsSkeleton count={6} />}
    {!likedLoading && likedShots.length === 0 && (
      <p className="text-center py-16 text-gray-400">Ще немає вподобаних робіт.</p>
    )}
    <ShotsGrid shots={likedShots} />
  </>
)}
```

---

## 9. Статистика підписників — клікабельна (опціонально)

Можна додати у `ProfilePage` модальне вікно при кліку на "Followers" / "Following":

```typescript
// Простий варіант через окремий компонент
import { useFollowersQuery, useFollowingQuery } from '../hooks/useSocial'

// При кліку на stats row:
const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null)
const { data: followers } = useFollowersQuery(followModal === 'followers' ? username : undefined)
const { data: following } = useFollowingQuery(followModal === 'following' ? username : undefined)
```

---

## 10. Перевірка інтеграції з бекендом

1. Увімкнути реальний бекенд: `VITE_USE_MOCKS=false`
2. Перевірити лайк — натиснути кнопку в `ShotCard` → кількість змінилась → при оновленні сторінки збережено
3. Перевірити коментарі — додати та видалити свій
4. Перевірити Follow — натиснути на чужому профілі → кнопка змінилась на "Following"
5. Перевірити вкладку Liked у ProfilePage — відображаються лайкнуті shots
