import { cn } from '../../utils/cn'

interface BackArrowProps {
  onClick?: () => void
  className?: string
}

export const BackArrow = ({ onClick, className }: BackArrowProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Назад"
      className={cn(
        'group absolute left-6 top-6 z-20 flex h-12 w-12 items-center justify-center',
        'text-voxel-black transition-opacity duration-200 hover:opacity-70 cursor-pointer',
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-7 w-7 transition-transform duration-200 ease-out group-hover:-translate-x-2.5"
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
    </button>
  )
}