import { useRef } from 'react'
import { cn } from '../../utils/cn'

interface AvatarPickerProps {
  preview: string | null
  onChange: (file: File) => void
  disabled?: boolean
  className?: string
}

export const AvatarPicker = ({ preview, onChange, disabled, className }: AvatarPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onChange(file)
  }

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        aria-label="Завантажити фото профілю"
        className={cn(
          'relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full',
          'border-2 border-dashed border-voxel-gray/60 bg-white/40 transition-all duration-200',
          'hover:border-voxel-black/60 hover:bg-white/60 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        {preview ? (
          <img src={preview} alt="" className="h-full w-full object-cover" draggable={false} />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-voxel-gray-dark">
            <path
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M17 8.5h2M18 7.5v2" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
          </svg>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif"
          onChange={handleFile}
          disabled={disabled}
          className="hidden"
        />
      </button>
      <p className="text-center text-[0.6875rem] leading-tight text-voxel-gray-dark">
        300px x 300px minimum
        <br />
        JPG, GIF, or PNG. Max file size 4MB.
      </p>
    </div>
  )
}
