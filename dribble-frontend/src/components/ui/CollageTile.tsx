import { Heart } from 'lucide-react'
import { cn } from '../../utils/cn'

interface CollageTileProps {
  image: string
  label: string
  count: string
  className?: string
  dark?: boolean
}

export const CollageTile = ({ image, label, count, className, dark = true }: CollageTileProps) => {
  return (
    <div className={cn('relative rounded-3xl overflow-hidden bg-surface-alt', className)}>
      <img src={image} alt={label} className="w-full h-full object-cover" loading="lazy" draggable={false} />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 flex items-center justify-between px-3 py-2 text-xs font-semibold',
          dark ? 'bg-linear-to-t from-black/55 to-transparent text-white' : 'bg-white/90 text-ink'
        )}
      >
        <span className="truncate">{label}</span>
        <span className="flex items-center gap-1 shrink-0">
          <Heart className="w-3.5 h-3.5" />
          {count}
        </span>
      </div>
    </div>
  )
}
