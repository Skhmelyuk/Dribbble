import { cn } from '../../utils/cn'

interface AvatarProps {
  /** URL аватара з бекенду. Може бути null/undefined/порожній рядок — якщо
   *  бекенд ще не має фото користувача, компонент сам покаже заглушку з
   *  ініціалом імені (без звернення до зовнішніх сервісів-заглушок). */
  src?: string | null
  username: string
  shape?: 'circle' | 'square'
  className?: string
  textClassName?: string
}

export const Avatar = ({
  src,
  username,
  shape = 'circle',
  className,
  textClassName = 'text-sm',
}: AvatarProps) => {
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl'

  if (src) {
    return (
      <img
        src={src}
        alt={username}
        className={cn('object-cover bg-surface-alt shrink-0', shapeClass, className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center bg-primary/10 font-bold text-primary',
        shapeClass,
        className
      )}
      aria-label={username}
      role="img"
    >
      <span className={cn('leading-none', textClassName)}>
        {username ? username.charAt(0).toUpperCase() : '?'}
      </span>
    </div>
  )
}