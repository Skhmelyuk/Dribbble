import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Search, Upload } from 'lucide-react'
import { useFeedQuery } from '../hooks/useShots'
import { ShotCard } from '../components/ui/ShotCard'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'

const POPULAR_TAGS = ['all', 'mobile', 'web', 'dashboard', 'productivity', 'glassmorphism', 'saas', 'banking', 'ui']

export const FeedPage = () => {
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  const [searchParams] = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tags') || 'all')
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '')

  // Затримка пошуку (debounce)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  const filters = {
    search: debouncedSearch || undefined,
    tags: selectedTag !== 'all' ? selectedTag : undefined,
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useFeedQuery(filters)

  // IntersectionObserver для нескінченної прокрутки
  const observerTarget = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = observerTarget.current
    if (!node || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 1.0 }
    )

    observer.observe(node)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNextPage, isFetchingNextPage])

  const shots = data?.pages.flatMap((page) => page.results) ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Заголовок + кнопка публікації */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-extrabold text-ink">Стрічка робіт</h1>
        {isAuthed && (
          <Link to="/upload">
            <Button size="sm">
              <Upload className="w-4 h-4" />
              Опублікувати
            </Button>
          </Link>
        )}
      </div>

      {/* Рядок фільтрації та пошуку */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 [&::-webkit-scrollbar]:hidden">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-primary text-white'
                  : 'bg-surface-alt border border-border text-muted hover:text-ink hover:border-gray-400'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Пошук робіт..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full bg-surface-alt border border-border pl-10 pr-4 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-4/3 rounded-2xl bg-surface-alt animate-pulse border border-border" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-12 text-red-500 font-semibold">
          Не вдалося завантажити стрічку робіт. Будь ласка, спробуйте пізніше.
        </div>
      )}

      {!isLoading && !isError && shots.length === 0 && (
        <div className="text-center py-24 text-muted">Робіт не знайдено за вашим запитом.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {shots.map((shot) => (
          <ShotCard key={shot.id} shot={shot} />
        ))}
      </div>

      <div ref={observerTarget} className="h-10 mt-8 flex justify-center items-center">
        {isFetchingNextPage && (
          <span className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        )}
      </div>
    </div>
  )
}
