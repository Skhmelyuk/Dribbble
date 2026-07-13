import logo from '../../assets/voxel-logo.png'
import { cn } from '../../utils/cn'

interface VoxelLogoProps {
  className?: string
}

export const VoxelLogo = ({ className }: VoxelLogoProps) => {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <img src={logo} alt="" className="h-12 w-auto select-none" draggable={false} />
      <span className="font-script text-2xl text-voxel-black -mt-1">Voxel</span>
    </div>
  )
}
