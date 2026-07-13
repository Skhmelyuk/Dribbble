import { Link } from 'react-router'
import { X } from 'lucide-react'
import type { FollowUser } from '../../types'
import { Avatar } from '../ui/Avatar'
import { Spinner } from '../ui/Spinner'

interface FollowListModalProps {
  title: string
  users: FollowUser[] | undefined
  isLoading: boolean
  onClose: () => void
}

export const FollowListModal = ({ title, users, isLoading, onClose }: FollowListModalProps) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-sm max-h-[70vh] flex flex-col bg-white rounded-3xl border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-alt hover:text-ink transition-colors cursor-pointer"
            aria-label="Закрити"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-3">
          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <Spinner size="md" />
            </div>
          )}

          {!isLoading && (!users || users.length === 0) && (
            <p className="text-center text-sm text-muted py-10">Список порожній.</p>
          )}

          {!isLoading &&
            users?.map((user) => (
              <Link
                key={user.id}
                to={`/users/${user.username}`}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-surface-alt transition-colors"
              >
                <Avatar src={user.avatar} username={user.username} className="w-10 h-10 border border-border" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{user.username}</p>
                  {user.bio && <p className="text-xs text-muted truncate">{user.bio}</p>}
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}