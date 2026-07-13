import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { Globe, UserPlus, UserCheck, MoreHorizontal, Check, Link2, Upload } from 'lucide-react'
import {
  usePublicProfileQuery,
  useFollowMutation,
  useLikedShotsQuery,
  useFollowersQuery,
  useFollowingQuery,
} from '../hooks/useUsers'
import { useFeedQuery } from '../hooks/useShots'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { ShotCard } from '../components/ui/ShotCard'
import { Spinner } from '../components/ui/Spinner'
import { Avatar } from '../components/ui/Avatar'
import { FollowListModal } from '../components/profile/FollowListModal'
import { CATEGORY_TAGS } from '../constants/categories'

// lucide-react більше не постачає брендові іконки (політика торгових
// марок), тому Twitter/Instagram/LinkedIn відмальовуються власними SVG.
const TwitterIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const InstagramIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
)

const LinkedInIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

type ProfileTab = 'work' | 'liked'
type FollowModal = 'followers' | 'following' | null

export const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>()
  const currentUser = useAuthStore((s) => s.user)
  const isAuthed = useAuthStore((s) => !!s.accessToken)

  const [activeTab, setActiveTab] = useState<ProfileTab>('work')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [followModal, setFollowModal] = useState<FollowModal>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  const { data: profile, isLoading, isError } = usePublicProfileQuery(username)
  const followMutation = useFollowMutation(username!)

  // Роботи автора (вкладка "Роботи") — фільтруємо за числовим id автора (GET /api/shots/?author=:id) та, за бажанням, за категорією
  const { data: shotsData, isLoading: shotsLoading } = useFeedQuery(
    { author: profile?.id, tags: activeCategory ?? undefined },
    { enabled: !!profile?.id }
  )
  const shots = shotsData?.pages.flatMap((page) => page.results) ?? []

  const availableCategories = CATEGORY_TAGS

  // Вподобані автором роботи
  const { data: likedData, isLoading: likedLoading } = useLikedShotsQuery(
    activeTab === 'liked' ? username : undefined
  )
  const likedShots = likedData?.pages.flatMap((page) => page.results) ?? []

  // Списки підписників/підписок
  const { data: followers, isLoading: followersLoading } = useFollowersQuery(
    followModal === 'followers' ? username : undefined
  )
  const { data: following, isLoading: followingLoading } = useFollowingQuery(
    followModal === 'following' ? username : undefined
  )

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="text-center py-24 text-red-500 font-semibold">
        Користувача не знайдено.
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16">
      {/*Шапка профілю*/}
      <div className="flex flex-col items-center text-center mb-10">
        <Avatar
          src={profile.avatar}
          username={profile.username}
          className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 border-4 border-white shadow-lg"
          textClassName="text-4xl sm:text-5xl"
        />

        <h1 className="font-app font-bold text-3xl sm:text-4xl md:text-[2.5rem] leading-tight text-ink mt-6">
          {profile.username}
        </h1>

        {profile.bio && (
          <p className="font-app font-bold text-lg sm:text-xl md:text-2xl text-ink/30 mt-2 max-w-lg">
            {profile.bio}
          </p>
        )}

        {/*Соціальні посилання (Website, Twitter/X, Instagram, LinkedIn)*/}
        <div className="flex items-center gap-4 mt-4">
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noreferrer"
              title="Website"
              className="text-ink/50 hover:text-ink transition-colors"
            >
              <Globe className="w-4 h-4" />
            </a>
          )}
          {profile.twitter && (
            <a
              href={profile.twitter}
              target="_blank"
              rel="noreferrer"
              title="Twitter / X"
              className="text-ink/50 hover:text-ink transition-colors"
            >
              <TwitterIcon />
            </a>
          )}
          {profile.instagram && (
            <a
              href={profile.instagram}
              target="_blank"
              rel="noreferrer"
              title="Instagram"
              className="text-ink/50 hover:text-ink transition-colors"
            >
              <InstagramIcon />
            </a>
          )}
          {profile.linkedin && (
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              title="LinkedIn"
              className="text-ink/50 hover:text-ink transition-colors"
            >
              <LinkedInIcon />
            </a>
          )}
        </div>

        {/* Статистика — Followers/Following клікабельні*/}
        <div className="flex items-center gap-6 mt-5 text-sm">
          <span>
            <b className="text-ink">{profile.shots_count}</b> <span className="text-muted">робіт</span>
          </span>
          <button type="button" onClick={() => setFollowModal('followers')} className="cursor-pointer hover:underline">
            <b className="text-ink">{profile.followers_count}</b> <span className="text-muted">підписників</span>
          </button>
          <button type="button" onClick={() => setFollowModal('following')} className="cursor-pointer hover:underline">
            <b className="text-ink">{profile.following_count}</b> <span className="text-muted">підписок</span>
          </button>
        </div>

        {/*Кнопки дій*/}
        <div className="flex items-center gap-3 mt-6">
          {isOwnProfile ? (
            <Link to="/profile">
              <Button variant="secondary" size="sm">
                Редагувати профіль
              </Button>
            </Link>
          ) : (
            isAuthed && (
              <Button
                variant={profile.is_following ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => followMutation.mutate()}
                isLoading={followMutation.isPending}
              >
                {profile.is_following ? (
                  <>
                    <UserCheck className="w-4 h-4" /> Ви підписані
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Підписатись
                  </>
                )}
              </Button>
            )
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            title="Скопіювати посилання на профіль"
            className="w-9 h-9 rounded-full border border-ink flex items-center justify-center text-ink hover:bg-surface-alt transition-colors cursor-pointer"
          >
            {linkCopied ? <Check className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
          </button>
        </div>
        {linkCopied && <span className="text-xs text-muted mt-2">Посилання скопійовано <Link2 className="w-3 h-3 inline" /></span>}
      </div>

      {/*Категорії робіт*/}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={
            'px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ' +
            (activeCategory === null ? 'bg-[#FF7CBA] text-ink' : 'border border-ink text-ink hover:bg-surface-alt')
          }
        >
          всі
        </button>
        {availableCategories.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveCategory(activeCategory === tag ? null : tag)}
            className={
              'px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ' +
              (activeCategory === tag ? 'bg-[#FF7CBA] text-ink' : 'border border-ink text-ink hover:bg-surface-alt')
            }
          >
            {tag}
          </button>
        ))}
      </div>

      {/*Вкладки: Роботи/Вподобані*/}
      <div className="flex items-center justify-center border-b border-border mb-10">
        {(['work', 'liked'] as ProfileTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              'px-6 py-3 text-sm font-semibold transition-colors cursor-pointer ' +
              (activeTab === tab ? 'border-b-2 border-ink text-ink' : 'text-muted hover:text-ink')
            }
          >
            {tab === 'work' ? 'Роботи' : 'Вподобані'}
          </button>
        ))}
      </div>

      {/*Вміст вкладки*/}
      {activeTab === 'work' &&
        (shotsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="md" />
          </div>
        ) : shots.length === 0 ? (
          isOwnProfile && activeCategory === null ? (
            <div className="max-w-md mx-auto flex flex-col items-center text-center gap-5 py-4">
              <div className="w-full aspect-4/3 rounded-[1.875rem] border border-dashed border-ink flex items-center justify-center">
                <Upload className="w-9 h-9 text-ink" strokeWidth={1.5} />
              </div>
              <h3 className="font-app font-semibold text-2xl text-ink">Завантажте свою першу роботу</h3>
              <p className="font-app font-semibold text-base text-ink/80">
                Покажіть свої найкращі роботи, отримайте відгуки, лайки та станьте частиною спільноти, що росте
              </p>
              <Link to="/upload">
                <Button size="sm" className="bg-ink hover:bg-ink/90">
                  Завантажити роботу
                </Button>
              </Link>
            </div>
          ) : activeCategory !== null ? (
            <p className="text-muted text-sm text-center">
              У {isOwnProfile ? 'вас' : 'цього користувача'} ще немає робіт із тегом «{activeCategory}».
            </p>
          ) : (
            <p className="text-muted text-sm text-center">Користувач ще не опублікував жодної роботи.</p>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10">
            {shots.map((shot) => (
              <ShotCard key={shot.id} shot={shot} />
            ))}
          </div>
        ))}

      {activeTab === 'liked' &&
        (likedLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="md" />
          </div>
        ) : likedShots.length === 0 ? (
          <p className="text-muted text-sm text-center">Ще немає вподобаних робіт.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10">
            {likedShots.map((shot) => (
              <ShotCard key={shot.id} shot={shot} />
            ))}
          </div>
        ))}

      {/* Модальне вікно підписників/підписок */}
      {followModal && (
        <FollowListModal
          title={followModal === 'followers' ? 'Підписники' : 'Підписки'}
          users={followModal === 'followers' ? followers : following}
          isLoading={followModal === 'followers' ? followersLoading : followingLoading}
          onClose={() => setFollowModal(null)}
        />
      )}
    </div>
  )
}
