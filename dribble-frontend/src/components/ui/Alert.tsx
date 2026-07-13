import { cn } from '../../utils/cn'

interface AlertProps {
  type: 'error' | 'success' | 'info'
  message: string
  className?: string
}

export const Alert = ({ type, message, className }: AlertProps) => {
  return (
    <div
      role="alert"
      className={cn(
        'p-4 text-sm rounded-2xl border font-app',
        type === 'error' && 'bg-red-50 border-red-200 text-red-600',
        type === 'success' && 'bg-green-50 border-green-200 text-green-700',
        type === 'info' && 'bg-blue-50 border-blue-200 text-blue-700',
        className
      )}
    >
      {message}
    </div>
  )
}
