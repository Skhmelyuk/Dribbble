import type { ReactNode } from 'react'
import { BackArrow } from './BackArrow'
import { cn } from '../../utils/cn'

interface AuthCardProps {
  children: ReactNode
  onBack?: () => void
  className?: string
}

export const AuthCard = ({ children, onBack, className }: AuthCardProps) => {
  return (
    <div className="relative w-full max-w-160">
      {onBack && <BackArrow onClick={onBack} />}
      <div
        className={cn(
          'flex w-full flex-col rounded-4xl border border-voxel-white/30 bg-voxel-white/75 px-14 py-12 shadow-2xl backdrop-blur-2xl',
          'h-190 gap-7 overflow-hidden justify-between',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}