import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <button
      disabled={isLoading || disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold font-app transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variant === 'primary' &&
          'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-primary/20 active:scale-95',
        variant === 'secondary' &&
          'border border-ink text-ink hover:bg-surface-alt active:scale-95',
        variant === 'ghost' &&
          'text-ink hover:bg-surface-alt active:scale-95',
        variant === 'danger' &&
          'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:scale-95',
        size === 'sm' && 'px-4 py-1.5 text-xs gap-1.5',
        size === 'md' && 'px-6 py-2.5 text-sm gap-2',
        size === 'lg' && 'px-8 py-3 text-base gap-2',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
      ) : null}
      {children}
    </button>
  )
}
