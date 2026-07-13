import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  isLoading?: boolean
}

export const AuthButton = ({
  active = true,
  isLoading,
  disabled,
  className,
  children,
  ...props
}: AuthButtonProps) => {
  const isDisabled = disabled || isLoading || !active

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold',
        'transition-colors duration-200 cursor-pointer select-none',
        active
          ? 'bg-voxel-black text-voxel-white hover:bg-voxel-black/85'
          : 'bg-voxel-gray text-voxel-white cursor-default',
        isLoading && 'cursor-wait',
        className
      )}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </button>
  )
}
