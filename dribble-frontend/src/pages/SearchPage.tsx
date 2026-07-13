import { useSearchParams, Link } from 'react-router'
import { useSearchQuery } from '../hooks/useSearch'
import { ShotCard } from '../components/ui/ShotCard'
import { Spinner } from '../components/ui/Spinner'
import { Avatar } from '../components/ui/Avatar'

export const SearchPage = () => {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''

  const { data, isLoading, isError } = useSearchQuery(q)

  if (!q.trim()) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-muted">
        Введіть запит у полі пошуку, щоб знайти роботи або користувачів.
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold text-ink mb-8">
        Результати пошуку за запитом «{q}»
      </h1>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {isError && (
        <div className="text-center py-12 text-red-500 font-semibold">
          Не вдалося виконати пошук. Спробуйте пізніше.
        </div>
      )}

      {data && (
        <>
          {/* Користувачі */}
          {data.users.count > 0 && (
            <section className="mb-12">
              <h2 className="text-lg font-bold text-ink mb-4">Користувачі ({data.users.count})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.users.results.map((u) => (
                  <Link
                    key={u.id}
                    to={`/users/${u.username}`}
                    className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-white hover:border-ink transition-colors"
                  >
                    <Avatar
                      src={u.avatar}
                      username={u.username}
                      className="w-12 h-12 border border-border"
                      textClassName="text-lg"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink truncate">{u.username}</p>
                      <p className="text-xs text-muted truncate">{u.bio}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Роботи */}
          <section>
            <h2 className="text-lg font-bold text-ink mb-4">Роботи ({data.shots.count})</h2>
            {data.shots.count === 0 ? (
              <p className="text-sm text-muted">Робіт за вашим запитом не знайдено.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {data.shots.results.map((shot) => (
                  <ShotCard key={shot.id} shot={shot} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}