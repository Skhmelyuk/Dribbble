import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[0.9375rem] font-semibold text-[#1A202C]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-2xl border-2 border-[#E2E8F0] bg-white px-6 py-4 text-[1.0625rem] text-[#1A202C] transition-all duration-200',
            'placeholder:text-[#A0AEC0]',
            'focus:border-[#236D8A] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#236D8A]/10',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)

AuthInput.displayName = 'AuthInput'