import { Link, useNavigate } from 'react-router'
import { Heart, MessageCircle, Bookmark } from 'lucide-react'
import type { Shot } from '../../types'
import { useAuthStore } from '../../store/authStore'
import { useLikeShotMutation, useSaveShotMutation } from '../../hooks/useShots'
import { cn } from '../../utils/cn'
import { Avatar } from './Avatar'

interface ShotCardProps {
  shot: Shot
}

const OverlayIconButton = ({
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) => (
  <button
    type="button"
    className={cn(
      'flex aspect-square w-10 shrink-0 items-center justify-center rounded-full bg-white btn-pop disabled:cursor-not-allowed disabled:opacity-60',
      active ? 'text-primary' : 'text-ink hover:text-primary',
      className
    )}
    {...props}
  />
)

export const ShotCard = ({ shot }: ShotCardProps) => {
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  const navigate = useNavigate()
  const likeMutation = useLikeShotMutation(shot.id)
  const saveMutation = useSaveShotMutation(shot.id)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthed || likeMutation.isPending) return
    likeMutation.mutate()
  }

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthed || saveMutation.isPending) return
    saveMutation.mutate()
  }

  const handleOpenComments = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/shot/${shot.id}#comments`)
  }

  return (
    <div className="group flex flex-col gap-3">
      {/* Зображення + hover-оверлей (назва + дії) */}
      <Link
        to={`/shot/${shot.id}`}
        className="relative block aspect-4/3 w-full overflow-hidden rounded-[1.875rem] bg-surface-alt"
      >
        <img
          src={shot.preview || shot.image}
          alt={shot.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute inset-0 flex items-end justify-between gap-3 bg-linear-to-t from-black/80 via-black/10 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="min-w-0 truncate font-app text-lg font-semibold text-white sm:text-xl">
            {shot.title}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <OverlayIconButton
              title="Лайк"
              onClick={handleLike}
              disabled={!isAuthed || likeMutation.isPending}
              active={shot.is_liked}
            >
              <Heart className="h-6 w-6" fill={shot.is_liked ? 'currentColor' : 'none'} />
            </OverlayIconButton>
            <OverlayIconButton
              title="Коментарі"
              onClick={handleOpenComments}
            >
              <MessageCircle className="h-6 w-6" />
            </OverlayIconButton>
            <OverlayIconButton
              title="Зберегти"
              onClick={handleSave}
              disabled={!isAuthed || saveMutation.isPending}
              active={shot.is_saved}
            >
              <Bookmark className="h-6 w-6" fill={shot.is_saved ? 'currentColor' : 'none'} />
            </OverlayIconButton>
          </div>
        </div>
      </Link>

      {/* Автор + лічильники — завжди видимі, під зображенням*/}
      <div className="flex items-center justify-between gap-3">
        <Link to={`/users/${shot.author.username}`} className="flex min-w-0 items-center gap-2.5">
          <Avatar
            src={shot.author.avatar}
            username={shot.author.username}
            className="w-10 h-10 border border-border"
          />
          <span className="min-w-0 truncate font-app text-base font-semibold text-ink">
            {shot.author.username}
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-3 text-sm font-semibold text-ink">
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" fill={shot.is_liked ? 'currentColor' : 'none'} />
            {shot.likes_count}
          </span>
          <button
            type="button"
            onClick={handleOpenComments}
            title="Переглянути коментарі"
            className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {shot.comments_count}
          </button>
        </div>
      </div>
    </div>
  )
}