import { useRef } from 'react'
import { cn } from '../../utils/cn'

interface OtpInputProps {
  length?: number
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

export const OtpInput = ({ length = 6, value, onChange, disabled }: OtpInputProps) => {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  const setDigit = (index: number, digit: string) => {
    const next = [...value]
    next[index] = digit
    onChange(next)
  }

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    setDigit(index, digit)
    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    e.preventDefault()
    const next = Array.from({ length }, (_, i) => pasted[i] ?? '')
    onChange(next)
    const lastIndex = Math.min(pasted.length, length) - 1
    inputsRef.current[lastIndex]?.focus()
  }

  return (
    <div className="flex w-full justify-center gap-3">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] ?? ''}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={cn(
            'h-18 w-18 bg-white/30 text-center text-2xl font-bold text-[#1A202C]',
            'transition-all duration-100 focus:outline-none',
            value[index]
              ? 'border-[0.1875rem] border-[#1A202C]'
              : 'border-2 border-[#CBD5E0]',
            'focus:border-[0.1875rem] focus:border-[#236D8A] focus:bg-white focus:shadow-lg focus:shadow-[#236D8A]/20',
            'disabled:opacity-50',
            index === 0 && 'rounded-l-2xl rounded-r-none',
            index === length - 1 && 'rounded-r-2xl rounded-l-none',
            index !== 0 && index !== length - 1 && 'rounded-none'
          )}
        />
      ))}
    </div>
  )
}