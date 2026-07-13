import { useParams, Link, useLocation } from 'react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { Heart, Bookmark, Trash2, Calendar, Send } from 'lucide-react'
import { useShotQuery, useDeleteShotMutation, useLikeShotMutation, useSaveShotMutation } from '../hooks/useShots'
import { useCommentsQuery, useAddCommentMutation, useDeleteCommentMutation } from '../hooks/useComments'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { CommentsSkeleton } from '../components/ui/CommentsSkeleton'
import { cn } from '../utils/cn'

export const ShotDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const currentUser = useAuthStore((s) => s.user)
  const isAuthed = useAuthStore((s) => !!s.accessToken)

  const { data: shot, isLoading, isError } = useShotQuery(id!)
  const deleteMutation = useDeleteShotMutation()
  const likeMutation = useLikeShotMutation(id!)
  const saveMutation = useSaveShotMutation(id!)

  const { data: commentsData, isLoading: commentsLoading } = useCommentsQuery(id!)
  const comments = Array.isArray(commentsData) ? commentsData : (commentsData?.results || [])
  const addCommentMutation = useAddCommentMutation(id!)
  const deleteCommentMutation = useDeleteCommentMutation(id!)
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    if (location.hash === '#comments' && shot) {
      document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash, shot])

  const handleAddComment = (e: FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    addCommentMutation.mutate(commentText.trim(), {
      onSuccess: () => setCommentText(''),
    })
  }

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
      <Link to="/feed" className="text-sm text-muted hover:text-ink transition-colors mb-6 inline-block">
        &larr; Назад до стрічки
      </Link>

      {/* Заголовок та автор */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-ink mb-2">{shot.title}</h1>
          <div className="flex items-center gap-3">
            <Link to={`/users/${shot.author.username}`}>
              <Avatar
                src={shot.author.avatar}
                username={shot.author.username}
                className="w-8 h-8 border border-border"
              />
            </Link>
            <div>
              <Link to={`/users/${shot.author.username}`} className="text-sm font-medium text-ink hover:text-primary transition-colors">
                {shot.author.username}
              </Link>
              <p className="text-xs text-muted flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(shot.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Кнопки дій */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="secondary"
            className={cn('flex-1 md:flex-initial', shot.is_liked && 'border-primary text-primary')}
            onClick={() => isAuthed && likeMutation.mutate()}
            disabled={!isAuthed || likeMutation.isPending}
          >
            <Heart className="w-4 h-4" fill={shot.is_liked ? 'currentColor' : 'none'} />
            Лайк ({shot.likes_count})
          </Button>
          <Button
            variant="secondary"
            className={cn('flex-1 md:flex-initial', shot.is_saved && 'border-primary text-primary')}
            onClick={() => isAuthed && saveMutation.mutate()}
            disabled={!isAuthed || saveMutation.isPending}
          >
            <Bookmark className="w-4 h-4" fill={shot.is_saved ? 'currentColor' : 'none'} />
            Зберегти
          </Button>

          {isAuthor && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="w-10 h-10 rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 flex items-center justify-center transition-colors btn-pop cursor-pointer disabled:opacity-50"
              title="Видалити Shot"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Головне зображення */}
      <div className="rounded-3xl overflow-hidden border border-border shadow-2xl bg-surface-alt mb-8">
        <img src={shot.image} alt={shot.title} className="w-full max-h-175 object-contain mx-auto" />
      </div>

      {/* Опис та теги */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-10">
          <div>
            <h3 className="text-lg font-bold text-ink mb-2">Опис</h3>
            <p className="text-muted leading-relaxed text-sm whitespace-pre-line">
              {shot.description || 'Опис відсутній.'}
            </p>
          </div>

          {/* Коментарі */}
          <div id="comments" className="scroll-mt-24">
            <h3 className="text-lg font-bold text-ink mb-4">Коментарі ({shot.comments_count})</h3>

            {isAuthed && (
              <form onSubmit={handleAddComment} className="flex items-center gap-2 mb-6">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Додати коментар..."
                  className="flex-1 rounded-full bg-white border border-border px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                  className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors btn-pop disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}

            {commentsLoading && <CommentsSkeleton />}

            {!commentsLoading && comments.length === 0 && (
              <p className="text-sm text-muted">Коментарів поки немає. Будьте першим!</p>
            )}

            <div className="flex flex-col gap-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                  <Avatar
                    src={comment.author.avatar}
                    username={comment.author.username}
                    className="w-8 h-8 border border-border"
                  />
                  <div className="bg-surface-alt rounded-2xl px-4 py-2.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{comment.author.username}</span>
                      <span className="text-xs text-muted">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-ink/80 mt-0.5">{comment.text}</p>
                  </div>
                  {currentUser?.id === comment.author.id && (
                    <button
                      type="button"
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      disabled={deleteCommentMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-red-500 shrink-0 self-start mt-2 cursor-pointer disabled:opacity-50 btn-pop"
                      title="Видалити коментар"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surface-alt border border-border rounded-2xl p-6 h-fit">
          <h3 className="text-sm font-semibold text-ink tracking-wider uppercase mb-4">Теги роботи</h3>
          {shot.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {shot.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/feed?tags=${tag}`}
                  className="px-3 py-1 bg-white hover:bg-border text-xs text-muted hover:text-ink rounded-full transition-all border border-border"
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