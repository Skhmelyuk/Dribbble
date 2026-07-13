import { cn } from '../../utils/cn'

interface AuthDividerProps {
  label?: string
  className?: string
}

export const AuthDivider = ({ label = 'or', className }: AuthDividerProps) => {
  return (
    <div className={cn('flex items-center gap-3 text-xs text-voxel-gray', className)}>
      <div className="h-px flex-1 bg-black/10" />
      <span>{label}</span>
      <div className="h-px flex-1 bg-black/10" />
    </div>
  )
}
