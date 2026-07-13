import type { ReactNode } from 'react'
import bgImage from '../../assets/auth-bg.jpg'

interface AuthBackgroundProps {
  children: ReactNode
}

export const AuthBackground = ({ children }: AuthBackgroundProps) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-voxel-black">
      <div
        aria-hidden
        className="auth-bg-image absolute inset-0 left-[-6%] w-[112%] h-full"
      >
        <img
          src={bgImage}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>

      <div aria-hidden className="absolute inset-0 bg-black/10" />

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-10">
        {children}
      </div>
    </div>
  )
}